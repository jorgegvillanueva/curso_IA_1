import { Box, Container, Typography } from '@mui/material';

export default function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" color="primary" gutterBottom>
          Gestor de Tareas ICE
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Prioriza tus tareas con el método ICE (Impact · Confidence · Effort)
        </Typography>
      </Box>
    </Container>
  );
}
