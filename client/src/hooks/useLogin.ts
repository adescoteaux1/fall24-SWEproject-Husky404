import { useNavigate } from 'react-router-dom';
import { ChangeEvent, useState } from 'react';
import useLoginContext from './useLoginContext';
/**
 * Interface for the useLogin hook.
 * @property username - The current value of the username input.
 * @property password - The current value of the password input.
 * @property handleInputChange - Function to handle changes in the input field.
 * @property handleSubmit - Function to handle login submission.
 * @property error - The current error message.
 */
interface UseLogin {
  username: string;
  email?: string;
  password: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  error: string | null;
}

/**
 * Custom hook to handle login input and submission.
 *
 * @returns username - The current value of the username input.
 * @returns handleInputChange - Function to handle changes in the input field.
 * @returns handleSubmit - Function to handle login submission
 */
const useLogin = (isLogin: boolean): UseLogin => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useLoginContext();
  const navigate = useNavigate();

  /**
   * Function to handle the input change event.
   *
   * @param e - the event object.
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'username') setUsername(value);
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
  };

  /**
   * Function to handle the form submission event.
   *
   * @param event - the form event object.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const endpoint = isLogin ? '/login' : '/createAccount';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, hashedPassword: password }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        const message = contentType?.includes('text/html')
          ? 'Cannot POST to the specified route.'
          : await response.text();

        throw new Error(message);
      }

      const data = await response.json();
      setUser({ username: data.username });
      navigate('/home'); // redirect to home page after login/registration
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return { username, password, handleInputChange, handleSubmit, error };
};

export default useLogin;
