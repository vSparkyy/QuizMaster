import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import "../styles/QuizSelection.css";

function QuizSelection() {
    const navigate = useNavigate();
    const location = useLocation();

    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const selectedTopic = queryParams.get("topic");
        if (selectedTopic == "ComputerScience") {
            setTopic("Computer Science");
        } else if (selectedTopic == "GeneralKnowledge") {
            setTopic("General Knowledge");
        }
        else
            setTopic(selectedTopic);
        
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!topic || !difficulty) {
            setError("Please select both a topic and a difficulty.");
            return;
        }
    
        setLoading(true);
        setError("");
    
        try {
            const response = await api.get("/api/questions/", {
                params: { topic, difficulty },
            });
    
            if (response.data.length === 0) {
                setError("No questions available for the selected topic and difficulty.");
                setLoading(false);
                return;
            }
    
            navigate("/quiz", { state: { questions: response.data, topic, difficulty } });
        } catch (err) {
            console.error("Error fetching questions:", err);
            setError("Failed to fetch questions. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="quiz-selection-container">
            <h1>Select Your Quiz</h1>
            <form onSubmit={handleSubmit} className="quiz-selection-form">
                <div className="form-row">
                    <div className="form-group form-group-row">
                        <label>Topic</label>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            required
                        >
                            <option value="">Select a topic</option>
                            <option value="Physics">Physics</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Math">Math</option>
                            <option value="History">History</option>
                            <option value="Geography">Geography</option>
                            <option value="General Knowledge">General Knowledge</option>
                        </select>
                    </div>
                    <div className="form-group form-group-row">
                        <label>Difficulty</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            required
                        >
                            <option value="">Select difficulty</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? "Loading..." : "Start Quiz"}
                </button>
            </form>
        </div>
    );
}

export default QuizSelection;
