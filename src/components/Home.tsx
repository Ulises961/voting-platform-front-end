import React from 'react';
import { Box, Typography } from '@mui/material';


export const Home: React.FC = () => {
    const [loggedIn, setLoggedIn] = React.useState(false);
    
    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Welcome to the Voting Platform
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Please login or register to vote on proposals
            </Typography>
        </Box>
    );
}