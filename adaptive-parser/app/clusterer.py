from collections import defaultdict

from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer

from app.event_skeleton import EventSkeletonBuilder
from app.log_adapter import LogAdapter
from app.log_event import CanonicalLogEvent
from app.log_normalizer import LogNormalizer
from app.log_signature import LogSignature


class UnknownLogClusterer:
    """
    Application-independent unknown-log clustering.

    Pipeline:

        raw input
            ↓
        LogAdapter
            ↓
        CanonicalLogEvent
            ↓
        structural signature partition
            ↓
        message normalization
            ↓
        event skeleton construction
            ↓
        TF-IDF + DBSCAN

    Raw strings remain supported for backward compatibility.

    Clusters always contain the original raw messages so downstream
    template generation and parameter extraction continue to operate
    on the original event representation.
    """

    def __init__(
        self,
        eps=0.50,
        min_samples=2,
        adapter=None,
        normalizer=None,
        signature=None,
        skeleton_builder=None,
    ):
        self.eps = eps
        self.min_samples = min_samples

        self.adapter = (
            adapter or LogAdapter()
        )

        self.normalizer = (
            normalizer or LogNormalizer()
        )

        self.signature = (
            signature or LogSignature()
        )

        self.skeleton_builder = (
            skeleton_builder
            or EventSkeletonBuilder()
        )

    def cluster(self, messages):
        if not messages:
            return {}

        events = [
            self._to_event(item)
            for item in messages
        ]

        partitions = defaultdict(list)

        for event in events:
            signature = self.signature.build(
                event
            )

            partitions[signature].append(
                event
            )

        clusters = {}
        next_cluster_id = 0
        noise_messages = []

        for partition_events in partitions.values():
            if (
                len(partition_events)
                < self.min_samples
            ):
                noise_messages.extend(
                    event.raw_message
                    for event in partition_events
                )
                continue

            normalized_messages = [
                self.normalizer.normalize(
                    event.message
                )
                for event in partition_events
            ]

            skeletons = (
                self.skeleton_builder.build_partition(
                    normalized_messages
                )
            )

            labels = self._cluster_partition(
                skeletons
            )

            local_clusters = defaultdict(list)

            for event, label in zip(
                partition_events,
                labels,
            ):
                if label == -1:
                    noise_messages.append(
                        event.raw_message
                    )
                    continue

                local_clusters[label].append(
                    event.raw_message
                )

            for local_cluster in (
                local_clusters.values()
            ):
                clusters[next_cluster_id] = (
                    local_cluster
                )

                next_cluster_id += 1

        if noise_messages:
            clusters[-1] = noise_messages

        return clusters

    def _cluster_partition(
        self,
        representations,
    ):
        if not representations:
            return []

        if len(representations) == 1:
            return [-1]

        # If all representations are identical, no vector-space
        # clustering is necessary.
        if len(set(representations)) == 1:
            if (
                len(representations)
                >= self.min_samples
            ):
                return [
                    0
                    for _ in representations
                ]

            return [
                -1
                for _ in representations
            ]

        vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            lowercase=True,
        )

        matrix = vectorizer.fit_transform(
            representations
        )

        model = DBSCAN(
            eps=self.eps,
            min_samples=self.min_samples,
            metric="cosine",
        )

        return model.fit_predict(
            matrix
        ).tolist()

    def _to_event(self, item):
        if isinstance(
            item,
            CanonicalLogEvent,
        ):
            return item

        if isinstance(item, str):
            return self.adapter.adapt(
                item
            )

        raise TypeError(
            "Cluster input must be a raw string "
            "or CanonicalLogEvent."
        )
