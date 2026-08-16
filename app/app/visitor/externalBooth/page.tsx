"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Box, Typography, Card, CardContent, Divider } from "@mui/material";

function VisitorPassContent() {
  const searchParams = useSearchParams();

  const firstname = searchParams.get("firstname") || "";
  const Booth = searchParams.get("Booth") || "";
  const start = searchParams.get("Start") || "";
  const end = searchParams.get("End") || "";
  const time = searchParams.get("Time") || "";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
      }}
    >
      <Card
        sx={{
          position: "relative",
          width: 350,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 4,
          border: "1px solid #e0e0e0",
          bgcolor: "#fff",
        }}
      >
        {/* Decorative Corners - Top Left */}
        <Box sx={{ position: "absolute", top: 0, left: 0 }}>
          <Box sx={{ width: 10, height: 50, bgcolor: "red" }} />
          <Box
            sx={{
              width: 10,
              height: 50,
              bgcolor: "black",
              position: "absolute",
              left: 10,
              top: 0,
            }}
          />
          <Box
            sx={{
              width: 10,
              height: 50,
              bgcolor: "gold",
              position: "absolute",
              left: 20,
              top: 0,
            }}
          />
        </Box>

        {/* Decorative Corners - Bottom Right */}
        <Box sx={{ position: "absolute", bottom: 0, right: 0 }}>
          <Box
            sx={{
              width: 10,
              height: 50,
              bgcolor: "red",
              position: "absolute",
              right: 0,
              bottom: 0,
            }}
          />
          <Box
            sx={{
              width: 10,
              height: 50,
              bgcolor: "black",
              position: "absolute",
              right: 10,
              bottom: 0,
            }}
          />
          <Box
            sx={{
              width: 10,
              height: 50,
              bgcolor: "gold",
              position: "absolute",
              right: 20,
              bottom: 0,
            }}
          />
        </Box>

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 4,
            px: 3,
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3 }}>
            <Image src="/images/guc-logo.jpg" alt="Logo" width={80} height={80} />
          </Box>

          {/* Info Section */}
          <Box sx={{ width: "100%", textAlign: "left" }}>
            <Typography variant="subtitle1" fontWeight={700}>
              NAME:{" "}
              <Typography component="span" fontWeight={400}>
                {firstname}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              BOOTH Vendor NAME:{" "}
              <Typography component="span" fontWeight={400}>
                {Booth}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              START DATE:{" "}
              <Typography component="span" fontWeight={400}>
                {start}
              </Typography>
            </Typography>

            <Typography variant="subtitle1" fontWeight={700}>
              END DATE:{" "}
              <Typography component="span" fontWeight={400}>
                {end}
              </Typography>
            </Typography>

          </Box>

          {/* Footer */}
          <Divider sx={{ borderColor: "gold", my: 2, width: "100%" }} />
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ fontStyle: "italic", mt: 1 }}
          >
            External Visitor Pass issued by EventSync Office
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function VisitorPass() {
  return (
    <Suspense fallback={null}>
      <VisitorPassContent />
    </Suspense>
  );
}
