from app.clusterer import UnknownLogClusterer
from app.generation_input import GenerationInput
from app.learning_candidate_builder import LearningCandidateBuilder
from app.metrics import EngineMetrics
from app.matcher_definition_builder import (
    RegexMatcherDefinitionBuilder,
)
from app.structural_template_reconstructor import (
    StructuralTemplateReconstructor,
)
from app.validator import ParserValidator


class AdaptiveParsingEngine:
    def __init__(
        self,
        registry,
        unknown_buffer,
        template_generator,
        minimum_cluster_size=3,
        matcher_definition_builder=None,
        template_reconstructor=None,
        validator=None,
    ):
        self.registry = registry
        self.unknown_buffer = unknown_buffer
        self.template_generator = template_generator
        self.minimum_cluster_size = minimum_cluster_size

        self.clusterer = UnknownLogClusterer(
            eps=0.60,
            min_samples=2,
        )

        self.candidate_builder = (
            LearningCandidateBuilder()
        )

        self.template_reconstructor = (
            template_reconstructor
            or StructuralTemplateReconstructor()
        )

        self.matcher_definition_builder = (
            matcher_definition_builder
            or RegexMatcherDefinitionBuilder()
        )

        self.validator = (
            validator
            or ParserValidator()
        )
        self.metrics = EngineMetrics()

        self.generated_parser_counter = 1

    def process(self, message):
        self.metrics.total_logs += 1

        # ---------------------------------------------------------
        # 1. Try existing registered parsers first.
        # ---------------------------------------------------------
        match = self.registry.match(message)

        if match["matched"]:
            self.metrics.known_logs += 1

            return {
                "status": "known",
                "parser_id": match["parser_id"],
                "template": match["template"],
                "parameters": match["parameters"],
                "template_generation_used": False,
                "template_generator": None,
                "fallback_used": False,
            }

        # ---------------------------------------------------------
        # 2. Unknown log: preserve it.
        # ---------------------------------------------------------
        self.unknown_buffer.add(message)

        unknown_messages = self.unknown_buffer.get_messages()

        if len(unknown_messages) < self.minimum_cluster_size:
            self.metrics.buffered_logs += 1

            return {
                "status": "buffered",
                "message": message,
                "buffer_size": len(unknown_messages),
                "template_generation_used": False,
                "template_generator": None,
                "fallback_used": False,
            }

        # ---------------------------------------------------------
        # 3. Cluster unknown logs.
        # ---------------------------------------------------------
        clusters = self.clusterer.cluster(unknown_messages)

        learned_parsers = []

        for cluster_id, cluster_messages in clusters.items():
            if cluster_id == -1:
                continue

            if len(cluster_messages) < self.minimum_cluster_size:
                continue

            # -----------------------------------------------------
            # 4. Evaluate candidate structural safety.
            #
            # The candidate cluster is the masking / learning scope.
            # The complete unknown population is the evidence scope.
            #
            # Unsafe candidates must never reach template generation
            # or an external provider.
            # -----------------------------------------------------
            learning_candidate = (
                self.candidate_builder.build(
                    cluster_messages,
                    evidence_messages=unknown_messages,
                )
            )

            if learning_candidate is None:
                continue

            # -----------------------------------------------------
            # 5. Verify local raw-envelope reconstruction support.
            #
            # If the raw envelope cannot be reconstructed locally,
            # there is no useful reason to cross the generation /
            # provider boundary.
            #
            # This check must happen before the generation metric is
            # incremented and before the generator is called.
            # -----------------------------------------------------
            if not self.template_reconstructor.can_reconstruct(
                learning_candidate.raw_messages
            ):
                continue

            # -----------------------------------------------------
            # 6. Infer candidate message-level template.
            # -----------------------------------------------------
            self.metrics.template_generation_calls += 1

            generation_input = (
                GenerationInput.from_candidate(
                    learning_candidate
                )
            )

            message_template = (
                self.template_generator.generate(
                    list(
                        generation_input.learning_messages
                    )
                )
            )

            generator_name = getattr(
                self.template_generator,
                "last_generator",
                None,
            )

            generator_errors = getattr(
                self.template_generator,
                "last_errors",
                [],
            )

            attempted_generators = getattr(
                self.template_generator,
                "last_attempted_generators",
                [],
            )

            fallback_used = (
                generator_name is not None
                and len(attempted_generators) > 1
            )

            if "groq" in attempted_generators:
                self.metrics.groq_attempts += 1

            if "mistral" in attempted_generators:
                self.metrics.mistral_attempts += 1

            if generator_name == "groq":
                self.metrics.groq_successes += 1

            if generator_name == "mistral":
                self.metrics.mistral_successes += 1

            if fallback_used:
                self.metrics.fallback_uses += 1

            if not message_template:
                continue

            # -----------------------------------------------------
            # 7. Reconstruct the raw-log envelope locally.
            #
            # The generator sees only structural learning messages.
            # Raw logs remain local and are used here only to restore
            # the deterministic envelope required by the parser.
            #
            # Unsupported or inconsistent envelopes fail closed.
            # -----------------------------------------------------
            template = (
                self.template_reconstructor.reconstruct(
                    raw_messages=cluster_messages,
                    message_template=message_template,
                )
            )

            if not template:
                continue

            # -----------------------------------------------------
            # 8. Build the executable matcher definition.
            # -----------------------------------------------------
            matcher_definition = (
                self.matcher_definition_builder.build(
                    template
                )
            )

            negative_messages = [
                candidate
                for candidate in unknown_messages
                if candidate not in cluster_messages
            ]

            # -----------------------------------------------------
            # 9. Validate candidate parser.
            # -----------------------------------------------------
            validation = self.validator.validate(
                matcher=matcher_definition,
                positive_messages=cluster_messages,
                negative_messages=negative_messages,
            )

            if not validation["passed"]:
                continue

            # -----------------------------------------------------
            # 10. Register validated parser.
            # -----------------------------------------------------
            parser_id = (
                f"auto_parser_"
                f"{self.generated_parser_counter:03d}"
            )

            self.generated_parser_counter += 1

            parser = self.registry.register(
                parser_id=parser_id,
                template=template,
                matcher=matcher_definition,
                parameter_count=validation["parameter_count"],
                validation=validation,
            )

            learned_parsers.append(parser)
            self.metrics.parsers_learned += 1

            self.unknown_buffer.remove_messages(
                cluster_messages
            )

        # ---------------------------------------------------------
        # 11. Retry original message after learning.
        # ---------------------------------------------------------
        match = self.registry.match(message)

        if match["matched"]:
            generator_name = getattr(
                self.template_generator,
                "last_generator",
                None,
            )

            generator_errors = getattr(
                self.template_generator,
                "last_errors",
                [],
            )

            fallback_used = (
                generator_name is not None
                and len(generator_errors) > 0
            )

            self.metrics.learned_and_parsed_logs += 1

            return {
                "status": "learned_and_parsed",
                "parser_id": match["parser_id"],
                "template": match["template"],
                "parameters": match["parameters"],
                "template_generation_used": True,
                "template_generator": generator_name,
                "fallback_used": fallback_used,
                "learned_parsers": learned_parsers,
            }

        self.metrics.unknown_logs += 1

        return {
            "status": "unknown",
            "message": message,
            "buffer_size": self.unknown_buffer.count(),
            "template_generation_used": bool(learned_parsers),
            "template_generator": getattr(
                self.template_generator,
                "last_generator",
                None,
            ),
            "fallback_used": bool(
                getattr(
                    self.template_generator,
                    "last_errors",
                    [],
                )
            ),
        }

    def get_metrics(self):
        return self.metrics.snapshot()
