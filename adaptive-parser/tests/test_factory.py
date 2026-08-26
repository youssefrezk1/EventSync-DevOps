import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.factory import (
    build_default_engine,
    build_default_template_generator,
)
from app.fallback_generator import FallbackTemplateGenerator
from app.redacting_generator import RedactingTemplateGenerator


class OfflineProvider:
    """
    Deterministic provider stand-in.

    Construction and use require no credentials or network access.
    """

    def __init__(self, name):
        self.name = name
        self.calls = []

    def generate(self, messages):
        self.calls.append(list(messages))
        return "offline-template"


TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "factory.test.json"
)

TEST_REGISTRY.write_text(
    json.dumps(
        {"parsers": []},
        indent=2,
    ),
    encoding="utf-8",
)


try:
    # =====================================================
    # TEMPLATE GENERATOR FACTORY
    # =====================================================

    print("===== TEMPLATE GENERATOR FACTORY =====")

    fake_groq = OfflineProvider("groq")
    fake_mistral = OfflineProvider("mistral")

    generator = build_default_template_generator(
        groq_generator=fake_groq,
        mistral_generator=fake_mistral,
    )

    print("OUTER GENERATOR:")
    print(type(generator).__name__)

    assert isinstance(
        generator,
        RedactingTemplateGenerator,
    )

    provider_chain = generator.generator

    print()
    print("PROVIDER CHAIN:")
    print(type(provider_chain).__name__)

    assert isinstance(
        provider_chain,
        FallbackTemplateGenerator,
    )

    provider_names = [
        name
        for name, _ in provider_chain.generators
    ]

    print()
    print("PROVIDER ORDER:")
    print(provider_names)

    assert provider_names == [
        "groq",
        "mistral",
    ]

    provider_instances = [
        provider
        for _, provider in provider_chain.generators
    ]

    assert provider_instances == [
        fake_groq,
        fake_mistral,
    ]

    print(
        "INJECTED PROVIDERS PRESERVED IN "
        "PRODUCTION ORDER"
    )

    # =====================================================
    # ENGINE FACTORY
    # =====================================================

    print()
    print("===== ENGINE FACTORY =====")

    engine = build_default_engine(
        registry_path=TEST_REGISTRY,
        minimum_cluster_size=3,
        template_generator=generator,
    )

    print("ENGINE:")
    print(type(engine).__name__)

    print("REGISTRY:")
    print(type(engine.registry).__name__)

    print("UNKNOWN BUFFER:")
    print(type(engine.unknown_buffer).__name__)

    print("TEMPLATE GENERATOR:")
    print(type(engine.template_generator).__name__)

    print("CLUSTERER:")
    print(type(engine.clusterer).__name__)

    assert engine.template_generator is generator

    assert isinstance(
        engine.template_generator,
        RedactingTemplateGenerator,
    )

    assert engine.minimum_cluster_size == 3

    assert (
        engine.clusterer.normalizer
        is not None
    )

    # =====================================================
    # SECURITY BOUNDARY
    # =====================================================

    print()
    print("===== SECURITY BOUNDARY =====")

    assert isinstance(
        engine.template_generator,
        RedactingTemplateGenerator,
    )

    assert (
        engine.template_generator.generator
        is provider_chain
    )

    print(
        "EXTERNAL PROVIDER CHAIN IS "
        "BEHIND REDACTION BOUNDARY"
    )

    print()
    print(
        "FACTORY OFFLINE TOPOLOGY TEST PASSED"
    )

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
