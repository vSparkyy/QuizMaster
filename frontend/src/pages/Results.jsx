import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Results.css";

function Results() {
    const navigate = useNavigate();
    const location = useLocation();
    const { percentage, grade, topic, difficulty, submitted_questions } =
        location.state || {};

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= percentage) {
                    clearInterval(timer);
                    return percentage;
                }
                return prev + 0.5;
            });
        }, 5);
    }, [percentage]);

    useEffect(() => {
        if (
            percentage === undefined ||
            grade === undefined ||
            !submitted_questions
        ) {
            navigate("/");
        }

        window.history.pushState(null, null, window.location.href);
        window.addEventListener("popstate", () => {
            navigate("/");
        });

        return () => {
            window.removeEventListener("popstate", () => {
                navigate("/");
            });
        };
    }, [navigate, percentage, grade, submitted_questions]);

    const formatAnswer = (answer) => {
        if (
            typeof answer === "string" &&
            answer.startsWith("[") &&
            answer.endsWith("]")
        ) {
            try {
                const parsedArray = JSON.parse(answer.replace(/'/g, '"'));
                return Array.isArray(parsedArray)
                    ? parsedArray.join(", ")
                    : answer;
            } catch (error) {
                console.error("Failed to parse answer:", error);
                return answer;
            }
        }
        return Array.isArray(answer) ? answer.join(", ") : answer;
    };

    return (
        <div className="results-container">
            <div className="results-content">
                <div className="left-pane">
                    <h1>Quiz Results</h1>
                    <h2>{`Topic: ${topic}`}</h2>
                    <h3
                        className={`difficulty-title ${difficulty?.toLowerCase()}`}
                    >
                        {`Difficulty: ${difficulty?.toUpperCase()}`}
                    </h3>

                    <div className="circle-container">
                        <div
                            className="circle-progress"
                            style={{
                                background: `conic-gradient(#4caf50 ${progress}%, #eeeeee ${progress}% 100%)`,
                            }}
                        >
                            <div className="circle-hollow">
                                <span className="grade-percentage">
                                    <span className="grade">{grade}</span>
                                    <span className="percentage">
                                        {progress}%
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => navigate("/")}>
                        Return to Home
                    </button>
                </div>

                <div className="right-pane">
                    <h3>Submitted Questions</h3>
                    <div className="submitted-questions">
                        {submitted_questions &&
                            submitted_questions.map((q, index) => (
                                <div key={index} className="question-card">
                                    <p>
                                        <strong>Q{index + 1}:</strong>{" "}
                                        {q.question_text}
                                    </p>
                                    <p>
                                        <strong>Your Answer:</strong>{" "}
                                        {formatAnswer(q.submitted_answer)}
                                    </p>
                                    <p>
                                        <strong>Correct Answer:</strong>{" "}
                                        {formatAnswer(q.correct_answer)}
                                    </p>
                                    <p
                                        className={`answer-status ${
                                            q.is_correct
                                                ? "correct"
                                                : "incorrect"
                                        }`}
                                    >
                                        {q.is_correct ? "Correct" : "Incorrect"}{" "}
                                        -{" "}
                                        <strong>
                                            {q.marks}/{q.total_marks}
                                        </strong>
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Results;
