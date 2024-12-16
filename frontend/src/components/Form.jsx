import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import api from "../api";
import "../styles/Form.css";

function Form({ route, method }) {
    const navigate = useNavigate();

    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [date_of_birth, setDateOfBirth] = useState("");
    const [year_group, setYearGroup] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState("");

    const name = method === "login" ? "Login" : "Register";

    useEffect(() => {
        const generateUsername = async () => {
            if (method === "register" && first_name && last_name && date_of_birth) {
                try {
                    const response = await api.get("api/generate-username/", {
                        params: { first_name, last_name, date_of_birth },
                    });
                    setUsername(response.data.username);
                } catch (error) {
                    console.error("Error generating username:", error);
                    setUsername("");
                }
            } else {
                setUsername("");
            }
        };

        generateUsername();
    }, [first_name, last_name, date_of_birth, method]);

    const validate = () => {
        const newErrors = {};

        if (method === "register") {
            if (!year_group || year_group < 1 || year_group > 13) {
                newErrors.year_group = "Year group must be between 1 and 13.";
            }

            const dob = new Date(date_of_birth);
            const today = new Date();
            if (!date_of_birth || isNaN(dob.getTime()) || dob > today) {
                newErrors.date_of_birth = "Invalid or future date of birth.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setLoginError("");
        try {
            const payload =
                method === "login"
                    ? { username, password }
                    : { first_name, last_name, date_of_birth, year_group, password };

            const response = await api.post(route, payload);
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
                localStorage.setItem("isSuperuser", response.data.user.is_superuser);
                localStorage.setItem("isStaff", response.data.user.is_staff);
                localStorage.setItem("currentUser", response.data.user.username);
                localStorage.setItem("firstName", response.data.user.first_name);
                navigate("/");
            } else {
                navigate("/login");
            }
        } catch (error) {
            if (method === "login") {
                setLoginError("Login failed: Invalid username or password.");
            } else {
                console.error("Registration error:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-page">
            {/* Back Arrow */}
            <div className="back-arrow" onClick={() => navigate("/")}>
                ← Back to Home
            </div>

            <form
                onSubmit={handleSubmit}
                className={`form-container ${method === "register" ? "register" : "login"}`}
            >
                <h1>{name}</h1>
                {method === "register" && (
                    <>
                        <div className="generated-username">{username}</div>
                        <div className="divider"></div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={first_name}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Enter First Name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={last_name}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Enter Last Name"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input
                                    className="form-input"
                                    type="date"
                                    value={date_of_birth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Year Group</label>
                                <select
                                    className="form-input"
                                    value={year_group}
                                    onChange={(e) => setYearGroup(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Select Year Group</option>
                                    {Array.from({ length: 13 }, (_, i) => i + 1).map((group) => (
                                        <option key={group} value={group}>
                                            Year {group}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group form-group-full">
                                <label className="form-label">Password</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>
                    </>
                )}
                {method === "login" && (
                    <>
                        <label className="form-label form-element">Username</label>
                        <input
                            className="form-input form-element"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter Username"
                            required
                        />
                        <label className="form-label form-element">Password</label>
                        <input
                            className="form-input form-element"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                        {loginError && (
                            <span className="form-error form-element">{loginError}</span>
                        )}
                    </>
                )}
                <button type="submit" className="form-button form-element" disabled={loading}>
                    {loading ? "Submitting..." : name}
                </button>
            </form>
        </div>
    );
}

export default Form;
