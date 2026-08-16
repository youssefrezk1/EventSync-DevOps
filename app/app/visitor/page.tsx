"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Box, Typography, Card, CardContent, Divider, Avatar } from "@mui/material";

function VisitorPageContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const company = searchParams.get("company") || "";
  const bazaar = searchParams.get("bazaar") || "";
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  const time = searchParams.get("time") || "";
  const photo = searchParams.get("photo") || "";

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
        {/* Decorative Corners */}
        <Box sx={{ position: "absolute", top: 0, left: 0 }}>
          <Box sx={{ width: 10, height: 50, bgcolor: "red" }} />
          <Box sx={{ width: 10, height: 50, bgcolor: "black", position: "absolute", left: 10, top: 0 }} />
          <Box sx={{ width: 10, height: 50, bgcolor: "gold", position: "absolute", left: 20, top: 0 }} />
        </Box>

        <Box sx={{ position: "absolute", bottom: 0, right: 0 }}>
          <Box sx={{ width: 10, height: 50, bgcolor: "red", position: "absolute", right: 0, bottom: 0 }} />
          <Box sx={{ width: 10, height: 50, bgcolor: "black", position: "absolute", right: 10, bottom: 0 }} />
          <Box sx={{ width: 10, height: 50, bgcolor: "gold", position: "absolute", right: 20, bottom: 0 }} />
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

          
{/* Photo Frame that wraps the photo */}
<Box
  sx={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    p: 1.2, // frame thickness
    border: "4px solid gold",
    borderTopColor: "black",
    borderLeftColor: "black",
    borderRadius: 2,
    mb: 4,
    backgroundColor: "#fff",
  }}
>
  {photo ? (
    <Box
      component="img"
      src={photo}
      alt="Visitor Photo"
      sx={{
        maxWidth: 200, // optional: limit max size
        maxHeight: 200,
        width: "auto",
        height: "auto",
        objectFit: "contain", // keeps full image visible
        borderRadius: 2,
        display: "block",
      }}
    />
  ) : (
    <Avatar
      sx={{
        width: 170,
        height: 170,
        bgcolor: "#e0e0e0",
        color: "#555",
        fontSize: 16,
      }}
    >
      No Photo
    </Avatar>
  )}
</Box>



          {/* Info Section */}
          <Box sx={{ width: "100%", textAlign: "left" }}>
            <Typography variant="subtitle1" fontWeight={700}>
              NAME:{" "}
              <Typography component="span" fontWeight={400}>
                {name}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              COMPANY NAME:{" "}
              <Typography component="span" fontWeight={400}>
                {company}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              BAZAAR NAME:{" "}
              <Typography component="span" fontWeight={400}>
                {bazaar}
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
            <Typography variant="subtitle1" fontWeight={700}>
              TIME:{" "}
              <Typography component="span" fontWeight={400}>
                {time}
              </Typography>
            </Typography>
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function VisitorPage() {
  return (
    <Suspense fallback={null}>
      <VisitorPageContent />
    </Suspense>
  );
}
