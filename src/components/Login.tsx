import { Box, Button, Typography } from '@mui/material';
import { useVoting } from '../context/VotingContext';
import { Hex } from 'viem';
import { Buffer } from 'buffer';
import { useEffect } from 'react';


const Login = () => {
  const { isRegistered, contract, jwt, isLoggedIn, loading, dispatch } = useVoting();

  const handleError = (err: any) => {
    dispatch({ type: 'SET_ERROR', payload: err });
  }

  const setIsLoggedIn = (isLoggedIn: boolean) => {
    dispatch({ type: 'SET_IS_LOGGED_IN', payload: isLoggedIn });
  }


  function parseJwt(token: string) {
    return ({
      header: Buffer.from(token.split(".")[0], "base64").toString(),
      payload: Buffer.from(token.split(".")[1], "base64").toString(),
      hexSig: ("0x" +
        Buffer.from(token.split(".")[2], "base64").toString("hex")) as Hex,
    });
  }

  const handleRegister = async () => {
    if (isRegistered || !contract) { return; }

    try {
      const { header, payload, hexSig } = parseJwt(jwt as string);
      const tx = await contract.registerWithDomain(header, payload, hexSig);
      await tx.wait();
      dispatch({ type: 'SET_IS_REGISTERED', payload: true });
    } catch (err) {
      console.error('Registration error:', err);
      handleError('Failed to process request');
      dispatch({ type: 'SET_IS_REGISTERED', payload: false });
      return;
    }
  };


  const handleLogin = async () => {
    if (!isRegistered || !contract) {
      return
    }

    try {
      const { header, payload, hexSig } = parseJwt(jwt as string);
      const tx = await contract.login(header, payload, hexSig);
      setIsLoggedIn(tx);
    } catch (err) {
      console.error('Login error:', err);
      handleError(err instanceof Error ? err.message : 'Failed to process request');
      setIsLoggedIn(false);
      return;
    }
  };
  
  useEffect(() => {
    if (isRegistered) {
      dispatch({ type: 'SET_IS_REGISTERED', payload: true });
    }
   }, [isRegistered, jwt]);

  return (
    <>
  {isRegistered}
      {!isRegistered && jwt &&
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" gutterBottom>
            Please register with the contract
          </Typography>
          <Button
            variant="contained"
            onClick={handleRegister}
            disabled={loading}
          >
            Register
          </Button>
        </Box>
      }
      
      {isRegistered && !isLoggedIn && jwt &&
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" gutterBottom>
            Please login with the contract
          </Typography>
          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
          >
            Login
          </Button>
        </Box>}
    </>
  );

}

export default Login;