import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { LoginFormProps } from '../types/interfaces';



export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, checkRegistration }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  
    const handleEmailCheck = async (email: string) => {
      if (!email.includes('@')) {
        setError('Please enter a valid email');
        return;
      }
      const domain = email.split('@')[1];
      const registered = await checkRegistration(domain);
      setIsRegistered(registered);
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onLogin(email, !isRegistered);
    };
  
    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {isRegistered ? 'Login to Vote' : 'Register to Vote'}
        </Typography>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setIsRegistered(null);
          }}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />
        {!isRegistered && (
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => handleEmailCheck(email)}
            sx={{ mb: 2 }}
          >
            Check Email
          </Button>
        )}
        <Button 
          fullWidth 
          variant="contained" 
          type="submit"
          disabled={isRegistered === null}
        >
          {isRegistered ? 'Login' : 'Register'}
        </Button>
      </Box>
    );
  };