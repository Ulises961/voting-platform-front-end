// src/contexts/VotingContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { VotingContextType, VotingState } from '../types/interfaces';
import { VotingAction } from '../types/interfaces'

const initialState: VotingState = {
    contract: null,
    account: '',
    isAdmin: false,
    jwt: null,
    votingPeriod: 86400, // ONE_DAY from your config
    isRegistered: false,
    isLoggedIn: false,
    proposals: [],
    loading: false,
    error: null
};

const VotingContext = createContext<VotingContextType | undefined>(undefined);

function votingReducer(state: VotingState, action: VotingAction): VotingState {
    switch (action.type) {
        case 'SET_CONTRACT':
            return { ...state, contract: action.payload };
        case 'SET_ACCOUNT':
            return { ...state, account: action.payload };
        case 'SET_IS_ADMIN':
            return { ...state, isAdmin: action.payload };
        case 'SET_VOTING_PERIOD':
            return { ...state, votingPeriod: action.payload };
        case 'SET_IS_REGISTERED':
            return { ...state, isRegistered: action.payload };
        case 'SET_PROPOSALS':
            return { ...state, proposals: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_JWT':
            return { ...state, jwt: action.payload };
        case 'SET_IS_LOGGED_IN':
            return { ...state, isLoggedIn: action.payload };
        default:
            return state;
    }
}

export function VotingProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(votingReducer, initialState);

    return (
        <VotingContext.Provider value={{ ...state, dispatch }}>
            {children}
        </VotingContext.Provider>
    );
}

export function useVoting() {
    const context = useContext(VotingContext);
    if (context === undefined) {
        throw new Error('useVoting must be used within a VotingProvider');
    }
    return context;
}