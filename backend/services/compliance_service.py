from backend.schemas.compliance import ComplianceBundle, ComplianceDocument


def get_compliance_bundle() -> ComplianceBundle:
    return ComplianceBundle(
        disclaimer="FinIntel provides market data, analytics, and research tooling for informational use only. It does not provide personalized investment advice or execution recommendations.",
        risk_warning="Equity, derivatives, and currency trading involve risk of capital loss. Users remain responsible for independent due diligence and regulatory compliance.",
        privacy_policy=ComplianceDocument(
            title="Privacy Policy",
            summary="FinIntel stores local portfolio records and user preferences in the configured application database.",
            sections=[
                "Broker credentials are not collected or persisted by the current application.",
                "Market data requests may be sent to third-party data providers such as Yahoo Finance.",
                "Operational logs should avoid personal financial information in production deployments.",
            ],
        ),
        terms_of_service=ComplianceDocument(
            title="Terms of Service",
            summary="FinIntel is a research interface, not a brokerage or registered advisory service.",
            sections=[
                "Users are responsible for verifying data quality before making investment decisions.",
                "The application must not be used to bypass broker security controls or automate prohibited login flows.",
                "Broker integrations must remain read-only for portfolio intelligence unless an explicit future redesign changes the product scope and compliance posture.",
                "Production deployments should enforce organization-specific access controls and audit logging.",
            ],
        ),
        consent_notice="By using the application, the user acknowledges the market-risk disclaimer and accepts the listed data-source limitations.",
        data_sources=[
            "Yahoo Finance end-of-day and delayed market data",
            "Application database records managed by the local backend",
        ],
    )
