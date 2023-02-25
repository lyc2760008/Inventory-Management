import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const API_URL = `${BACKEND_URL}/api/users`;

const CompleteRegistration = () => {
  const { token } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      axios
        .get(`${API_URL}/completeRegistration/${token}`)
        .then((res) => setUser(res.data))
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const handleComplete = async () => {
    try {
      navigate("/login");
    } catch (err) {
      setIsLoading(false);
      console.error(err);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Complete Registration</h1>
      <p>Thank you for registering, {user.name}!</p>
      <p>Please click the button below to login:</p>
      <button onClick={handleComplete} disabled={isLoading}>
        {isLoading ? "Loading..." : "Go Login!"}
      </button>
    </div>
  );
};

export default CompleteRegistration;
