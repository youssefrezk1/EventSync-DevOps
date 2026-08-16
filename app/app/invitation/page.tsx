"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Divider, 
  Avatar,
  Alert
} from "@mui/material";

function InvitationContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const photo = searchParams.get("photo") || "";
  const student = searchParams.get("student") || "";
  const issue = searchParams.get("issue") || "";
  const expiry = searchParams.get("expiry") || "";
  const id = searchParams.get("id") || "";

  // Check if expired
  const expiryDate = new Date(expiry);
  const isExpired = new Date() > expiryDate;

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

          {/* Expired Alert (if applicable) */}
          {isExpired && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              This guest pass has expired
            </Alert>
          )}

          {/* Photo Frame that wraps the photo */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1.2,
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
                alt="Guest Photo"
                sx={{
                  maxWidth: 200,
                  maxHeight: 200,
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
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
          <Box sx={{ width: "100%", textAlign: "left" ,mt:1}}>
            <Typography variant="subtitle1" fontWeight={700}>
              GUEST NAME:{" "}
              <Typography component="span" fontWeight={400}>
                {name}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              INVITED BY:{" "}
              <Typography component="span" fontWeight={400}>
                {student}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              ISSUE DATE:{" "}
              <Typography component="span" fontWeight={400}>
                {issue}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              EXPIRATION DATE:{" "}
              <Typography 
                component="span" 
                fontWeight={400}
                sx={{ color: isExpired ? 'error.main' : 'inherit' }}
              >
                {expiry}
              </Typography>
            </Typography>
            <Divider sx={{ borderColor: "gold", my: 1 }} />

            <Typography variant="subtitle1" fontWeight={700}>
              STATUS:{" "}
              <Typography 
                component="span" 
                fontWeight={600}
                sx={{ color: isExpired ? 'error.main' : 'success.main' }}
              >
                {isExpired ? 'EXPIRED' : 'VALID'}
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
              Guest Pass issued by EventSync Office
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function InvitationPageContent() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    }>
      <InvitationContent />
    </Suspense>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={null}>
      <InvitationPageContent />
    </Suspense>
  );
}
