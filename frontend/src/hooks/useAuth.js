import { useAuth } from '../context/AuthContext';

const useAuthHook = () => {
    return useAuth();
};

export default useAuthHook;
