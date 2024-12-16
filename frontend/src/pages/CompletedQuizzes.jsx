import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/CompletedQuizzes.css";

function CompletedQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCompletedQuizzes = async () => {
            try {
                const response = await api.get("/api/completed-quizzes/", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });
                setQuizzes(response.data);
            } catch (err) {
                console.error("Failed to fetch quizzes:", err);
                setError("Failed to load quizzes. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCompletedQuizzes();
    }, []);

    const handleQuizClick = (quiz) => {
        navigate("/results", {
            state: {
                percentage: quiz.percentage,
                grade: quiz.grade,
                topic: quiz.topic,
                difficulty: quiz.difficulty,
                submitted_questions: quiz.questions,
            },
        });
    };

    return (
        <div className="completed-quizzes-container">
            <div className="header">
                <span className="return-home" onClick={() => navigate("/")}>
                    ← Return to Home
                </span>
                <h1>Your Completed Quizzes</h1>
            </div>
            {loading ? (
                <div className="loading">Loading...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : quizzes.length === 0 ? (
                <div className="no-quizzes">You haven't completed any quizzes yet!</div>
            ) : (
                <div className="quiz-grid">
                    {quizzes.map((quiz, index) => (
                        <div
                            key={index}
                            className="quiz-card"
                            onClick={() => handleQuizClick(quiz)}
                        >
                            <h2>{quiz.topic}</h2>
                            <p><strong>Grade:</strong> {quiz.grade}</p>
                            <p><strong>Percentage:</strong> {quiz.percentage}%</p>
                            <p><strong>Difficulty:</strong> {quiz.difficulty}</p>
                            <p><strong>Date:</strong> {quiz.created_at}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CompletedQuizzes;
