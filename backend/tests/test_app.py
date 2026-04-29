import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


class AppTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tempdir = tempfile.TemporaryDirectory()
        os.environ["FININTEL_DB_PATH"] = str(Path(cls.tempdir.name) / "test.db")
        os.environ["FININTEL_APP_SECRET"] = "test-secret"

        from backend.app import create_app
        from backend.database.db import init_db

        init_db()
        cls.client = TestClient(create_app())
        session_response = cls.client.post("/auth/session")
        cls.session_token = session_response.json()["token"]

    @classmethod
    def tearDownClass(cls) -> None:
        cls.tempdir.cleanup()

    def test_healthcheck(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_portfolio_requires_session(self) -> None:
        response = self.client.post("/market/portfolio/holdings", json={"ticker": "INFY", "qty": 1, "price": 100})
        self.assertEqual(response.status_code, 401)

    def test_settings_endpoint_rejects_secret_storage(self) -> None:
        response = self.client.post("/settings/vault", headers={"X-Session-Token": self.session_token})
        self.assertEqual(response.status_code, 400)

    def test_document_analysis(self) -> None:
        response = self.client.post(
            "/analyze/document",
            headers={"X-Session-Token": self.session_token},
            json={"text": "The agreement includes indemnity, termination rights, and liability limits for the provider."},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["risk_clauses"])

    def test_broker_account_defaults_to_disabled(self) -> None:
        response = self.client.get("/market/broker/account", headers={"X-Session-Token": self.session_token})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["mode"], "read-only")
        self.assertEqual(response.headers["X-Process-Time-Ms"] != "", True)

    @patch("backend.services.research_service._search_sources")
    def test_company_due_diligence_endpoint(self, mock_search_sources) -> None:
        from backend.schemas.research import ResearchSource

        mock_search_sources.side_effect = [
            [ResearchSource(title="SEBI order update", url="https://example.com/legal", snippet="SEBI review", source_type="legal")],
            [ResearchSource(title="Quarterly results update", url="https://example.com/news", snippet="earnings growth", source_type="news")],
            [ResearchSource(title="Long term valuation blog", url="https://example.com/blog", snippet="valuation view", source_type="blog")],
            [ResearchSource(title="Investor thread", url="https://example.com/social", snippet="bull thesis", source_type="social")],
        ]
        response = self.client.get("/market/company-intel/INFY")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ticker"], "INFY")

    def test_portfolio_context_endpoint(self) -> None:
        response = self.client.get("/market/portfolio-context/INFY", headers={"X-Session-Token": self.session_token})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ticker"], "INFY")
