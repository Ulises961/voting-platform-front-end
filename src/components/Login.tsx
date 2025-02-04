import { Box, Button, Typography } from '@mui/material';
import { useVoting } from '../context/VotingContext';
import { Hex } from 'viem';
import { Buffer } from 'buffer';
import { useEffect } from 'react';


const Login = () => {

  const { isRegistered, contract, jwt, isLoggedIn, loading, dispatch, account } = useVoting();

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
      await contract.registerWithDomain(header, payload, hexSig);
      dispatch({ type: 'SET_IS_REGISTERED', payload: true });
      setIsLoggedIn(true);
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
      checkUserRegistration();
    }, [account, contract]);

    const checkUserRegistration = async () => {
        if (!contract) return;
        console.log("checking registration");
        // Get the list of events with the VoterRegistered event so we can check if the user is registered
        const voterRegisteredFilter = contract.filters.VoterRegistered()
        const voterRegisteredEvents = await contract.queryFilter(voterRegisteredFilter)
        console.log('voterRegisteredEvents:', voterRegisteredEvents);
        // Check if the user is registered
        const isRegistered = voterRegisteredEvents.some((event: any) => {
            const addresses: Array<string> = event.args?.map((address: string) => address.toLowerCase());
            return addresses.includes(account);
        });
        // If the user is not registered, register them
        dispatch({ type: 'SET_IS_REGISTERED', payload: isRegistered });

    }

  console.log('isRegistered', isRegistered);
  console.log('isLoggedIn', isLoggedIn);
  console.log('jwt', jwt);

  return (
    <>
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