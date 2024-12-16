import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AdminPanel.css";

function AdminPanel() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [userReport, setUserReport] = useState(null);
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [topicReport, setTopicReport] = useState(null);
    const [errorUserReport, setErrorUserReport] = useState("");
    const [errorTopicReport, setErrorTopicReport] = useState("");
    const [loadingUserReport, setLoadingUserReport] = useState(false);
    const [loadingTopicReport, setLoadingTopicReport] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const staffUsername = localStorage.getItem("currentUser");
    const searchTimeoutRef = useRef(null);
    const isSuggestionSelected = useRef(false);

    useEffect(() => {
        const isSuperuser = localStorage.getItem("isSuperuser");
        if (isSuperuser !== "true") {
            navigate("/");
        }
    }, [navigate]);

    const handleUserReport = async () => {
        setLoadingUserReport(true);
        setErrorUserReport("");
        try {
            const response = await api.post("/api/user-quizzes-report/", {
                username: username,
            });
            setUserReport(response.data);
        } catch (err) {
            setUserReport(null);
            setErrorUserReport(
                err.response?.data?.error || "Failed to fetch user report."
            );
        } finally {
            setLoadingUserReport(false);
        }
    };

    const handleTopicReport = async () => {
        setLoadingTopicReport(true);
        setErrorTopicReport("");
        try {
            const response = await api.post("/api/topic-difficulty-report/", {
                topic: topic,
                difficulty: difficulty,
            });
            setTopicReport(response.data);
        } catch (err) {
            setTopicReport(null);
            setErrorTopicReport(
                err.response?.data?.error || "Failed to fetch topic report."
            );
        } finally {
            setLoadingTopicReport(false);
        }
    };

    useEffect(() => {
        if (isSuggestionSelected.current) {
            isSuggestionSelected.current = false;
            return;
        }

        if (!username.trim()) {
            setUserSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await api.get("/api/search/", {
                    params: { query: username },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "accessToken"
                        )}`,
                    },
                });
                setUserSuggestions(res.data);
                setShowSuggestions(true);
            } catch (err) {
                console.error("User search error:", err);
                setUserSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [username]);

    const handleUsernameChange = (e) => {
        const value = e.target.value.trim();
        setUsername(value);
        setErrorUserReport("");
        setUserReport(null);
        setShowSuggestions(false);
    };

    const handleTopicChange = (e) => {
        const value = e.target.value;
        setTopic(value);
        setErrorTopicReport("");
        setTopicReport(null);
    };

    const handleDifficultyChange = (e) => {
        const value = e.target.value;
        setDifficulty(value);
        setErrorTopicReport("");
        setTopicReport(null);
    };

    const handleSuggestionClick = (suggestion) => {
        isSuggestionSelected.current = true;
        setUsername(suggestion.username);
        setUserSuggestions([]);
        setShowSuggestions(false);
        setErrorUserReport("");
        setUserReport(null);
    };

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <div className="header-left">
                    <button
                        className="back-button"
                        onClick={() => navigate(-1)}
                        aria-label="Go Back"
                    >
                        ← Go Back
                    </button>
                </div>
                <div className="header-center">
                    <h1>Welcome to the Admin Panel, {staffUsername}</h1>
                </div>
                <div className="header-right"></div>
            </header>
            <main className="admin-content">
                <div className="reports-container">
                    <section className="report-section">
                        <h2>User Quiz Report</h2>
                        <p>
                            Enter a username to generate a report of all quizzes taken
                            by that user, along with their grades.
                        </p>
                        <div className="report-content">
                            <div className="input-column">
                                <div className="input-group user-search-group">
                                    <label htmlFor="username-input">Username</label>
                                    <input
                                        id="username-input"
                                        type="text"
                                        value={username}
                                        onChange={handleUsernameChange}
                                        placeholder="Type to search users..."
                                        onFocus={() => {
                                            if (userSuggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                    />
                                    {showSuggestions && userSuggestions.length > 0 && (
                                        <div className="suggestions-dropdown">
                                            {userSuggestions.map((u, idx) => (
                                                <div
                                                    key={idx}
                                                    className="suggestion-item"
                                                    onClick={() => handleSuggestionClick(u)}
                                                >
                                                    {u.username}
                                                    {u.first_name || u.last_name
                                                        ? ` (${u.first_name} ${u.last_name})`
                                                        : ""}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleUserReport}
                                    disabled={loadingUserReport || !username}
                                    className="generate-button"
                                >
                                    {loadingUserReport ? "Generating..." : "Generate Report"}
                                </button>
                            </div>
                            <div className="output-column">
                                <div className="report-output">
                                    {errorUserReport ? (
                                        <p className="error-text">{errorUserReport}</p>
                                    ) : userReport ? (
                                        <>
                                            <h3>Quizzes for {userReport.user}</h3>
                                            <div className="scrollable-content">
                                                {userReport.quizzes.length > 0 ? (
                                                    <ul>
                                                        {userReport.quizzes.map((quiz, index) => (
                                                            <li key={index} className="quiz-item">
                                                                <strong>Topic:</strong> {quiz.topic}
                                                                <br />
                                                                <strong>Difficulty:</strong>{" "}
                                                                {quiz.difficulty}
                                                                <br />
                                                                <strong>Grade:</strong> {quiz.grade}
                                                                <br />
                                                                <strong>Percentage:</strong>{" "}
                                                                {quiz.percentage}%<br />
                                                                <strong>Date:</strong>{" "}
                                                                {quiz.created_at}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>No quizzes found for this user.</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="placeholder-text">No user report generated yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="report-section">
                        <h2>Topic & Difficulty Report</h2>
                        <p>
                            Select a topic and difficulty to see the average score,
                            highest score, and top user for that category.
                        </p>
                        <div className="report-content">
                            <div className="input-column">
                                <div className="input-group">
                                    <label htmlFor="topic-select">Topic</label>
                                    <select
                                        id="topic-select"
                                        value={topic}
                                        onChange={handleTopicChange}
                                    >
                                        <option value="">Select Topic</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Math">Math</option>
                                        <option value="Computer Science">
                                            Computer Science
                                        </option>
                                        <option value="Geography">Geography</option>
                                        <option value="History">History</option>
                                        <option value="General Knowledge">
                                            General Knowledge
                                        </option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="difficulty-select">Difficulty</label>
                                    <select
                                        id="difficulty-select"
                                        value={difficulty}
                                        onChange={handleDifficultyChange}
                                    >
                                        <option value="">Select Difficulty</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleTopicReport}
                                    disabled={loadingTopicReport || !topic || !difficulty}
                                    className="generate-button"
                                >
                                    {loadingTopicReport ? "Generating..." : "Generate Report"}
                                </button>
                            </div>
                            <div className="output-column">
                                <div className="report-output">
                                    {errorTopicReport ? (
                                        <p className="error-text">{errorTopicReport}</p>
                                    ) : topicReport ? (
                                        <>
                                            <h3>
                                                Report for {topic} ({difficulty.toUpperCase()})
                                            </h3>
                                            <div className="scrollable-content">
                                                <p>
                                                    <strong>Average Score:</strong>{" "}
                                                    {topicReport.average_score}%
                                                </p>
                                                <p>
                                                    <strong>Highest Score:</strong>{" "}
                                                    {topicReport.highest_score}%
                                                </p>
                                                <p>
                                                    <strong>Top User:</strong>{" "}
                                                    {`${topicReport.top_user.first_name} ${topicReport.top_user.last_name} (${topicReport.top_user.username})`}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="placeholder-text">No topic & difficulty report generated yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default AdminPanel;
