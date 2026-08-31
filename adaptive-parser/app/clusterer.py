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
            ↓
        conservative exact-skeleton cross-signature recovery

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
        noise_events = []

        # =====================================================
        # PHASE 1
        #
        # Existing signature-bounded clustering.
        #
        # This remains the primary safety boundary.
        # =====================================================
        for partition_events in partitions.values():
            if (
                len(partition_events)
                < self.min_samples
            ):
                noise_events.extend(
                    partition_events
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
                    noise_events.append(
                        event
                    )
                    continue

                local_clusters[label].append(
                    event
                )

            for local_cluster in (
                local_clusters.values()
            ):
                clusters[next_cluster_id] = (
                    local_cluster
                )

                next_cluster_id += 1

        # =====================================================
        # PHASE 2
        #
        # Conservative cross-signature recovery.
        #
        # Recovery is allowed only when a candidate combination
        # produces one exact shared structural skeleton across
        # every member.
        #
        # No fuzzy cross-signature similarity is used here.
        #
        # Existing successful clusters are preserved unless a
        # noise candidate is structurally identical to the entire
        # cluster under one jointly inferred skeleton.
        # =====================================================
        if noise_events:
            (
                clusters,
                noise_events,
                next_cluster_id,
            ) = self._recover_cross_signature(
                clusters=clusters,
                noise_events=noise_events,
                next_cluster_id=next_cluster_id,
            )

        output = {}

        for cluster_id, cluster_events in (
            clusters.items()
        ):
            output[cluster_id] = [
                event.raw_message
                for event in cluster_events
            ]

        if noise_events:
            output[-1] = [
                event.raw_message
                for event in noise_events
            ]

        return output

    def _recover_cross_signature(
        self,
        clusters,
        noise_events,
        next_cluster_id,
    ):
        """
        Recover structurally identical families split by signature.

        Safety rule:

        A noise event or recovered noise family may join an existing
        cluster only when jointly rebuilding skeletons across the
        complete candidate set yields exactly one identical skeleton.

        This intentionally avoids fuzzy similarity across signatures.
        """
        remaining_noise = list(
            noise_events
        )

        changed = True

        while changed and remaining_noise:
            changed = False

            # -------------------------------------------------
            # 1. Attempt to attach individual noise events to
            #    an existing successful cluster.
            # -------------------------------------------------
            for noise_event in list(
                remaining_noise
            ):
                matched_cluster_id = None

                for (
                    cluster_id,
                    cluster_events,
                ) in clusters.items():

                    candidate_events = (
                        list(cluster_events)
                        + [noise_event]
                    )

                    if (
                        self._exact_shared_skeleton(
                            candidate_events
                        )
                        or self._runtime_optional_compatible(
                            cluster_events,
                            noise_event,
                        )
                    ):
                        matched_cluster_id = (
                            cluster_id
                        )
                        break

                if matched_cluster_id is not None:
                    clusters[
                        matched_cluster_id
                    ].append(
                        noise_event
                    )

                    remaining_noise.remove(
                        noise_event
                    )

                    changed = True

            if changed:
                continue

            # -------------------------------------------------
            # 2. Attempt to recover a new family solely from
            #    remaining cross-signature noise.
            #
            #    We use groups of events that jointly collapse
            #    to one exact skeleton.
            # -------------------------------------------------
            recovered_group = None

            for seed in remaining_noise:
                candidate_group = [
                    seed
                ]

                for candidate in remaining_noise:
                    if candidate is seed:
                        continue

                    proposed = (
                        candidate_group
                        + [candidate]
                    )

                    if self._exact_shared_skeleton(
                        proposed
                    ):
                        candidate_group = (
                            proposed
                        )

                if (
                    len(candidate_group)
                    >= self.min_samples
                ):
                    recovered_group = (
                        candidate_group
                    )
                    break

            if recovered_group is not None:
                clusters[next_cluster_id] = (
                    list(recovered_group)
                )

                next_cluster_id += 1

                for event in recovered_group:
                    remaining_noise.remove(
                        event
                    )

                changed = True

        return (
            clusters,
            remaining_noise,
            next_cluster_id,
        )

    def _exact_shared_skeleton(
        self,
        events,
    ):
        if (
            len(events)
            < self.min_samples
        ):
            return False

        normalized_messages = [
            self.normalizer.normalize(
                event.message
            )
            for event in events
        ]

        skeletons = (
            self.skeleton_builder.build_partition(
                normalized_messages
            )
        )

        return (
            bool(skeletons)
            and len(set(skeletons)) == 1
        )

    def _runtime_optional_compatible(
        self,
        cluster_events,
        candidate_event,
    ):
        """
        Allow one non-runtime candidate token at a position that an
        established cluster already proves is runtime-bearing.

        Structural variation already learned by EventSkeletonBuilder
        is preserved. This helper therefore compares the established
        family skeleton with the jointly inferred candidate skeleton
        instead of comparing normalized raw messages directly.

        No sentinel vocabulary is hard-coded.
        """
        if (
            len(cluster_events)
            < self.min_samples
        ):
            return False

        cluster_normalized = [
            self.normalizer.normalize(
                event.message
            )
            for event in cluster_events
        ]

        established_skeletons = (
            self.skeleton_builder.build_partition(
                cluster_normalized
            )
        )

        if (
            not established_skeletons
            or len(set(established_skeletons)) != 1
        ):
            return False

        established_tokens = (
            established_skeletons[0].split()
        )

        candidate_normalized = (
            self.normalizer.normalize(
                candidate_event.message
            )
        )

        joint_normalized = (
            cluster_normalized
            + [candidate_normalized]
        )

        joint_skeletons = (
            self.skeleton_builder.build_partition(
                joint_normalized
            )
        )

        if not joint_skeletons:
            return False

        candidate_tokens = (
            joint_skeletons[-1].split()
        )

        if (
            len(candidate_tokens)
            != len(established_tokens)
        ):
            return False

        differing_positions = [
            position
            for position, (
                established_value,
                candidate_value,
            ) in enumerate(
                zip(
                    established_tokens,
                    candidate_tokens,
                )
            )
            if (
                established_value
                != candidate_value
            )
        ]

        if len(differing_positions) != 1:
            return False

        position = differing_positions[0]

        runtime_markers = (
            "<NUM>",
            "<IP>",
            "<UUID>",
            "<TIMESTAMP>",
            "<EMAIL>",
            "<SECRET>",
        )

        established_value = (
            established_tokens[position]
        )

        candidate_value = (
            candidate_tokens[position]
        )

        if not any(
            marker in established_value
            for marker in runtime_markers
        ):
            return False

        if any(
            marker in candidate_value
            for marker in runtime_markers
        ):
            return False

        return True

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
