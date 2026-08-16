import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Link,
  CircularProgress,
  Container,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  ThemeProvider,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api } from '../../../api';
import theme from '../../lib/theme';

interface Partner {
  wirId: string;
  companyName: string;
  logo: string | null;
  discountRate: number;
  promoCode: string;
  termsAndConditions: string;
}

const LoyaltyPartners: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/wir');
      setPartners(response.data.partners);
      setError(null);
    } catch (err) {
      setError('Failed to load loyalty partners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPromoCode = async (promoCode: string, wirId: string) => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopiedId(wirId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2500);
    } catch (err) {
      console.error('Failed to copy promo code:', err);
    }
  };

  const handleOpenDialog = (wirId: string) => {
    setOpenDialog(wirId);
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
  };

  const getDialogPartner = () => {
    return partners.find(p => p.wirId === openDialog);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const dialogPartner = getDialogPartner();

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={{ py: 3, bgcolor: '#E8F4F8', minHeight: '100vh' }}>
        <Grid container spacing={3}>
          {partners.map((partner) => (
            <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}} key={partner.wirId} >
              <Box sx={{ position: 'relative', padding: '16px' }}>
                <Box
                  sx={{
                    position: 'relative',
                    bgcolor: '#FFFFFF',
                    borderRadius: '18px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.11)',
                    p: 3,
                    textAlign: 'center',
                    width: '255px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: 240,
                    maskImage: `
                      radial-gradient(circle 8px at 0% 15%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 15%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 30%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 30%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 45%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 45%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 60%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 60%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 75%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 75%, transparent 0, transparent 8px, black 8px),
                      linear-gradient(black, black)
                    `,
                    maskComposite: 'intersect',
                    WebkitMaskImage: `
                      radial-gradient(circle 8px at 0% 15%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 15%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 30%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 30%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 45%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 45%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 60%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 60%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 0% 75%, transparent 0, transparent 8px, black 8px),
                      radial-gradient(circle 8px at 100% 75%, transparent 0, transparent 8px, black 8px),
                      linear-gradient(black, black)
                    `,
                    WebkitMaskComposite: 'source-in',
                  }}
                >
                  <Box
                    sx={{
                      height: 90,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      justifyContent: 'center',
                      mb: 2,
                      position: 'relative'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 5,
                        left: '15%',
                        width: 8,
                        height: 8,
                        bgcolor: '#93c7c1',
                        borderRadius: '50%',
                        opacity: 0.7
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: '20%',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '10px solid #336879',
                        opacity: 0.6
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: '25%',
                        width: 6,
                        height: 6,
                        bgcolor: '#CFF6F0',
                        transform: 'rotate(45deg)',
                        opacity: 0.7
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        right: '15%',
                        width: 5,
                        height: 5,
                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                        bgcolor: '#93c7c1',
                        opacity: 0.7
                      }}
                    />

                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={partner.companyName}
                        style={{
                          maxWidth: '85%',
                          maxHeight: '85%',
                          objectFit: 'contain',
                          position: 'relative',
                          zIndex: 1,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }}
                      />
                    ) : (
                      <Typography variant="h6" color="text.secondary" sx={{ zIndex: 1 }}>
                        {partner.companyName}
                      </Typography>
                    )}
                  </Box>

                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 900,
                      mb: 1,
                      color: 'text.primary',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontSize: '1.2rem',
                      lineHeight: 1.2
                    }}
                  >
                    {partner.companyName}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      mb: 1.5,
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}
                  >
                    {partner.discountRate}% discount
                  </Typography>

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'secondary.dark',
                      mb: 0.8,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      fontSize: '0.62rem',
                      fontWeight: 700
                    }}
                  >
                    PROMO CODE
                  </Typography>

                  <Tooltip 
                    title={copiedId === partner.wirId ? "Copied!" : "Click to copy"} 
                    arrow
                    placement="top"
                  >
                    <Box
                      onClick={() => handleCopyPromoCode(partner.promoCode, partner.wirId)}
                      sx={{
                        position: 'relative',
                        border: '2px dashed',
                        borderColor: copiedId === partner.wirId ? '#2eb2deff' : '#93c7c1',
                        borderRadius: 2,
                        px: 2.5,
                        mb: 2.5,
                        bgcolor: copiedId === partner.wirId ? '#bee7fdff' : '#F0FFFE',
                        width: '90%',
                        maxWidth: '200px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(147,199,193,0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 12px rgba(147,199,193,0.25)',
                          borderColor: copiedId === partner.wirId ? '#89CFF0' : '#2eb2deff',
                        },
                        '&:active': {
                          transform: 'scale(0.98)',
                        }
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 800,
                          color: copiedId === partner.wirId ? '#010d32ff' : 'primary.main',
                          fontSize: '0.95rem',
                          letterSpacing: '1.5px',
                          textAlign: 'center',
                          width: 'auto',
                          maxWidth: 'none',
                          transform: partner.promoCode.length > 10 ? `scale(${10 / partner.promoCode.length})` : 'scale(1)',
                          transformOrigin: 'center center',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                          margin: 0,
                          transition: 'color 0.3s ease'
                        }}
                      >
                        {partner.promoCode}
                      </Typography>
                      
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'white',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {copiedId === partner.wirId ? (
                          <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                        ) : (
                          <ContentCopyIcon sx={{ fontSize: 14, color: '#93c7c1' }} />
                        )}
                      </Box>
                    </Box>
                  </Tooltip>

                  <Box sx={{ mt: 0.5 }}>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => handleOpenDialog(partner.wirId)}
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        fontFamily: 'inherit',
                        fontSize: '0.68rem',
                        p: 0,
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      Click to view terms and conditions
                    </Link>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {partners.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No loyalty partners available at the moment
            </Typography>
          </Box>
        )}

        <Dialog 
          open={!!openDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              boxShadow: '0 8px 32px rgba(0,61,82,0.2)',
              borderRadius: 3,
              height: '400px',
              maxHeight: '80vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '2px solid',
            borderColor: 'secondary.light',
            pb: 2
          }}>
            <Typography component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Terms and Conditions
            </Typography>
            <IconButton 
              onClick={handleCloseDialog} 
              size="small"
              sx={{
                bgcolor: 'secondary.light',
                '&:hover': {
                  bgcolor: 'secondary.main',
                  color: 'white'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent 
            sx={{ 
              pt: 3,
              overflowY: 'auto',
              height: 'calc(600px - 80px)',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#93c7c1',
                borderRadius: '10px',
                '&:hover': {
                  backgroundColor: '#336879',
                }
              }
            }}
          >
            {dialogPartner && (
              <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                {dialogPartner.termsAndConditions}
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
};

export default LoyaltyPartners;