from app.adaptive_engine import AdaptiveParsingEngine
from app.fallback_generator import FallbackTemplateGenerator
from app.groq_generator import GroqTemplateGenerator
from app.mistral_generator import MistralTemplateGenerator
from app.parser_registry import ParserRegistry
from app.redacting_generator import RedactingTemplateGenerator
from app.unknown_buffer import UnknownBuffer


def build_default_template_generator(
    groq_generator=None,
    mistral_generator=None,
):
    """
    Build the production template-generation chain.

    External providers receive only structurally validated
    learning messages produced by the engine's GenerationInput
    boundary.

    Redaction remains as an additional defense-in-depth boundary
    before provider transmission.

    Provider order:
        1. Groq
        2. Mistral

    Provider instances may be injected for deterministic offline
    testing. Production callers that omit them receive the real
    provider implementations.
    """

    if groq_generator is None:
        groq_generator = GroqTemplateGenerator()

    if mistral_generator is None:
        mistral_generator = MistralTemplateGenerator()

    provider_chain = FallbackTemplateGenerator(
        [
            ("groq", groq_generator),
            ("mistral", mistral_generator),
        ]
    )

    return RedactingTemplateGenerator(
        generator=provider_chain
    )


def build_default_engine(
    registry_path,
    minimum_cluster_size=3,
    template_generator=None,
):
    """
    Build the default adaptive parsing engine.

    Known logs are parsed locally.

    Unknown logs are buffered and clustered locally.

    Only structurally validated GenerationInput learning
    messages may cross the external-provider boundary.

    Raw logs remain local for envelope reconstruction and final
    parser validation.

    Provider-bound learning messages are additionally redacted as
    defense in depth.
    """

    registry = ParserRegistry(
        registry_path
    )

    unknown_buffer = UnknownBuffer()

    if template_generator is None:
        template_generator = (
            build_default_template_generator()
        )

    return AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=unknown_buffer,
        template_generator=template_generator,
        minimum_cluster_size=minimum_cluster_size,
    )
