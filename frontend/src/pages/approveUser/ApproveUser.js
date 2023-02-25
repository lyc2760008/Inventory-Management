import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const API_URL = `${BACKEND_URL}/api/users`;

const ApproveUser = () => {
  const { token } = useParams();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const decodedToken = jwt_decode(token);
      const userId = decodedToken.id.toString().substring(0, 24);
      axios
        .get(`${API_URL}/admingetuser/${userId}`)
        .then((res) => setUser(res.data))
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const handleApprove = () => {
    try {
      axios
        .put(`${API_URL}/approve/${token}`)
        .then((res) => console.log(res.data))
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    navigate("/dashboard");
  };

  if (!user) {
    return (
      <div>
        Are you sure you are admin...if you are sure about it, talk to Yichen
        please!
      </div>
    );
  }

  return (
    <div>
      <h1>Approve User</h1>
      <p>Are you sure you want to approve {user.name}?</p>
      <button onClick={handleApprove}>Approve</button>
      <button onClick={handleReject}>Reject</button>
    </div>
  );
};

export default ApproveUser;

/*
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jwt from "jsonwebtoken";

const ApproveUser = () => {
  const { token } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const decoded = jwt.verify(token, process.env.REACT_APP_SECRET_KEY);
    axios
      .get(`/api/users/${decoded._id}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleApprove = () => {
    const decoded = jwt.verify(token, process.env.REACT_APP_SECRET_KEY);
    axios
      .put(`/api/users/approve/${decoded._id}`)
      .then((res) => console.log(res.data))
      .catch((err) => console.error(err));
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Approve User</h1>
      <p>Are you sure you want to approve {user.name}?</p>
      <button onClick={handleApprove}>Approve</button>
    </div>
  );
};

export default ApproveUser;

*/
