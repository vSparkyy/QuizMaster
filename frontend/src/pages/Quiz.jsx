import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Quiz.css";
import api from "../api";

function Quiz() {
    const location = useLocation();
    const navigate = useNavigate();

    const { questions, topic, difficulty } = location.state || {};
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener("popstate", () => {
            window.history.pushState(
                null,
                document.title,
                window.location.href
            );
        });
        return () => {
            window.removeEventListener("popstate", () => {
                window.history.pushState(
                    null,
                    document.title,
                    window.location.href
                );
            });
        };
    }, []);

    if (!questions) {
        navigate("/quizzes");
        return null;
    }

    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionChange = (e) => {
        setAnswers({
            ...answers,
            [currentQuestion.id]: e.target.value,
        });
        setError("");
    };

    const handleCheckboxChange = (e) => {
        const value = e.target.value;
        setAnswers((prevAnswers) => {
            const selectedAnswers = prevAnswers[currentQuestion.id] || [];
            if (e.target.checked) {
                return {
                    ...prevAnswers,
                    [currentQuestion.id]: [...selectedAnswers, value],
                };
            } else {
                return {
                    ...prevAnswers,
                    [currentQuestion.id]: selectedAnswers.filter(
                        (answer) => answer !== value
                    ),
                };
            }
        });
    };

    const handleTextareaChange = (e) => {
        setAnswers({
            ...answers,
            [currentQuestion.id]: e.target.value,
        });
        setError("");
    };

    const isAnswered = (questionId) => {
        const answer = answers[questionId];
        if (!answer) return false;
        if (Array.isArray(answer)) return answer.length > 0;
        return !!answer;
    };

    const goToNextQuestion = () => {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    };

    const goToPreviousQuestion = () => {
        setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
        setError("");
    };

    const handleCircleClick = (index) => {
        setCurrentQuestionIndex(index);
        setError("");
    };

    const handleSubmit = async () => {
        const unansweredQuestions = questions.filter(
            (question) => !isAnswered(question.id)
        );

        if (unansweredQuestions.length > 0) {
            setError(
                `You must answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`
            );
            return;
        }

        setIsLoading(true); 
        try {
            const payload = {
                topic,
                difficulty,
                submitted_answers: answers,
            };

            const response = await api.post("api/submit-quiz/", payload);

            navigate("/results", {
                state: {
                    percentage: response.data.percentage,
                    grade: response.data.grade,
                    topic,
                    difficulty,
                    submitted_questions: response.data.submitted_questions,
                },
            });
        } catch (err) {
            console.error("Error submitting quiz:", err);
            setError("Failed to submit the quiz. Please try again.");
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="quiz-container">
            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Submitting your quiz...</p>
                </div>
            ) : (
                <div className="quiz-content">
                    <h1>
                        Quiz: {topic}{" "}
                        <span
                            className={`difficulty-text ${
                                difficulty === "hard"
                                    ? "hard"
                                    : difficulty === "medium"
                                    ? "medium"
                                    : "easy"
                            }`}
                        >
                            ({difficulty.toUpperCase()})
                        </span>
                    </h1>

                    <div className="question-container">
                        <h2>
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </h2>
                        <p>
                            {currentQuestion.question_text}{" - "}
                            <strong>{currentQuestion.marks} mark(s)</strong>
                        </p>
                        {currentQuestion.question_type === "multiple_choice" && (
                            <div className="options-container">
                                {currentQuestion.options.map((option, index) => (
                                    <div key={index} className="option">
                                        <label>
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestion.id}`}
                                                value={option}
                                                checked={
                                                    answers[currentQuestion.id] === option
                                                }
                                                onChange={handleOptionChange}
                                            />
                                            {option}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentQuestion.question_type === "multiple_select" && (
                            <div className="options-container">
                                {currentQuestion.options.map((option, index) => (
                                    <div key={index} className="option">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name={`question-${currentQuestion.id}`}
                                                value={option}
                                                checked={answers[currentQuestion.id]?.includes(option)}
                                                onChange={handleCheckboxChange}
                                            />
                                            {option}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentQuestion.question_type === "long_answer" && (
                            <div className="options-container">
                                <textarea
                                    name={`question-${currentQuestion.id}`}
                                    value={answers[currentQuestion.id] || ""}
                                    onChange={handleTextareaChange}
                                    placeholder="Type your answer here..."
                                />
                            </div>
                        )}
                    </div>

                    {error && <div className="quiz-error">{error}</div>}
                    <div className="quiz-progress">
                        {questions.map((_, index) => (
                            <div
                                key={index}
                                className={`progress-circle ${
                                    index === currentQuestionIndex ? "active" : ""
                                } ${isAnswered(questions[index].id) ? "answered" : ""}`}
                                onClick={() => handleCircleClick(index)}
                            ></div>
                        ))}
                    </div>

                    <div className="quiz-navigation">
                        {currentQuestionIndex > 0 && (
                            <button onClick={goToPreviousQuestion}>Previous</button>
                        )}
                        {currentQuestionIndex < questions.length - 1 && (
                            <button onClick={goToNextQuestion}>Next</button>
                        )}
                        {currentQuestionIndex === questions.length - 1 && (
                            <button onClick={handleSubmit}>Submit Quiz</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Quiz;
