import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";

const RegisterAndLoginFrom = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLoginOrRegister === "register" ? "register" : "login";
    const { data, status } = await axios.post(url, { username, password });
    if (status != 200) {
      alert(data);
    }
    setLoggedInUsername(username);
    setId(data.id);
  };
  return (
    <div className="flex items-center justify-center h-screen bg-blue-200">
      <div className="bg-gray-200 p-9 rounded-xl shadow-md w-1/4 h-2/5">
        <h1 className="text-2xl font-semibold mb-4 text-center text-blue-700 ">
          {isLoginOrRegister === "register" ? "Register" : "Login"}
        </h1>
        <form onSubmit={handleSubmit} className="w-64 mx-auto mb-12">
          <h2 className="text-black mb-2">Username </h2>
          <input
            type="text"
            value={username}
            className="block w-full rounded-2xl p-2 mb-3 border"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <h2 className="text-black mb-2">Password </h2>
          <input
            type="password"
            value={password}
            className="block w-full rounded-2xl p-2 mb-5 border"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-500 text-white block w-full rounded-3xl p-2">
            {isLoginOrRegister === "register" ? "Register" : "Login"}
          </button>
          <div className="text-center mt-2">
            {isLoginOrRegister === "register" && (
              <div className="ml-1 text-yellow-500">
                Already a member ?{" "}
                <button
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  onClick={() => {
                    setIsLoginOrRegister("login");
                  }}
                >
                  Login
                </button>
              </div>
            )}

            {isLoginOrRegister === "login" && (
              <div className="ml-1 text-red-600">
                Don't have an account ?{" "}
                <button
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  onClick={() => {
                    setIsLoginOrRegister("register");
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterAndLoginFrom;
