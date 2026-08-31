import unittest

from app.log_sanitizer import LogSanitizer


class LogSanitizerTests(unittest.TestCase):
    def setUp(self):
        self.sanitizer = LogSanitizer()

    def test_plain_message_is_unchanged(self):
        message = (
            "GET /api/events "
            "200 12.742 ms - 531"
        )

        self.assertEqual(
            self.sanitizer.sanitize(message),
            message,
        )

    def test_morgan_ansi_colors_are_removed(self):
        message = (
            "\x1b[0mGET /api/events "
            "\x1b[32m200\x1b[0m "
            "12.742 ms - 531\x1b[0m"
        )

        self.assertEqual(
            self.sanitizer.sanitize(message),
            (
                "GET /api/events "
                "200 12.742 ms - 531"
            ),
        )

    def test_multiple_ansi_sequences_are_removed(self):
        message = (
            "\x1b[36mPOST\x1b[0m "
            "/api/events "
            "\x1b[33m201\x1b[0m "
            "18.913 ms - 325"
        )

        self.assertEqual(
            self.sanitizer.sanitize(message),
            (
                "POST /api/events "
                "201 18.913 ms - 325"
            ),
        )

    def test_non_string_message_is_rejected(self):
        with self.assertRaises(TypeError):
            self.sanitizer.sanitize(
                {"message": "not-a-string"}
            )


if __name__ == "__main__":
    unittest.main()
