'use client'

import { useVoting } from '../context/VotingContext'
import { AppBar, Toolbar, Button, Box } from '@mui/material'
import { useRouter } from 'next/navigation'

export default function Navigation() {
    const { isAdmin, isLoggedIn, account, jwt, dispatch } = useVoting()
    const router = useRouter();

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT', payload: undefined });
        router.push('/');
    }

    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ flexGrow: 1 }}>
                    <Button color="inherit" onClick={() => router.push('/')}>
                        Home
                    </Button>
                    {isLoggedIn && (
                        <Button color="inherit" onClick={() => router.push('/proposals')}>
                            Proposals
                        </Button>
                    )}
                    {account && (
                        <Button color="inherit" onClick={() => router.push('/domain')}>
                            Domain
                        </Button>
                    )
                    }
                    {isAdmin && (
                        <Button color="inherit" onClick={() => router.push('/admin')}>
                            Admin
                        </Button>
                    )
                    }
                </Box>
                <Box>
                    {account && (
                        isLoggedIn ? (
                            <Button color="inherit" onClick={handleLogout}>
                                Logout
                            </Button>
                        ) : (
                            <Button color="inherit" onClick={() => router.push('/login')}>
                                Login
                            </Button>
                        )
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    )
}