import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [isSuperuser, setIsSuperuser] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem("currentUser");
        const storedFirstName = localStorage.getItem("firstName");
        const superuserStatus = localStorage.getItem("isSuperuser") === "true";
        setCurrentUser(user);
        setFirstName(storedFirstName || "");
        setIsSuperuser(superuserStatus);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setCurrentUser(null);
        navigate("/login");
    };

    return (
        <div className="home-container">
            <div className="navbar">
                <div className="navbar-logo" onClick={() => navigate("/")}>
                    <img
                        src="src/images/logo.jpg"
                        alt="QuizGenius Logo"
                        className="navbar-logo-img"
                    />
                    <span className="navbar-title">QuizGenius</span>
                </div>
                <div className="navbar-links">
                    {isSuperuser && (
                        <span
                            className="navbar-link"
                            onClick={() => navigate("/admin")}
                        >
                            Admin Panel
                        </span>
                    )}
                    {!currentUser && (
                        <span
                            className="navbar-link"
                            onClick={() => navigate("/register")}
                        >
                            Register
                        </span>
                    )}
                    <span
                        className="navbar-link"
                        onClick={() => navigate("/completed-quizzes")}
                    >
                        Completed Quizzes
                    </span>
                    <span
                        className="navbar-link"
                        onClick={() => navigate("/quizzes")}
                    >
                        Quiz Selection
                    </span>
                    {currentUser ? (
                        <span className="navbar-link" onClick={handleLogout}>
                            Logout
                        </span>
                    ) : (
                        <span
                            className="navbar-link"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </span>
                    )}
                </div>
            </div>
            <header className="home-header">
                <h1>
                    Welcome to QuizGenius
                    {firstName && `, ${firstName}!`}
                </h1>
                <p>Test your knowledge with our diverse range of quizzes!</p>
            </header>
            <main className="topics-section">
                <div className="topics-row">
                    <div
                        className="topic-card"
                        onClick={() => navigate("/quizzes?topic=Physics")}
                    >
                        <img src="src/images/physics.jpg" alt="Physics" />
                        <h2>Physics</h2>
                        <p>
                            Explore the mysteries of the universe with quizzes on
                            physical principles and phenomena.
                        </p>
                    </div>
                    <div
                        className="topic-card"
                        onClick={() => navigate("/quizzes?topic=ComputerScience")}
                    >
                        <img
                            src="src/images/computer-science.jpg"
                            alt="Computer Science"
                        />
                        <h2>Computer Science</h2>
                        <p>
                            Dive into programming concepts, algorithms, and computer
                            science principles.
                        </p>
                    </div>
                    <div
                        className="topic-card"
                        onClick={() => navigate("/quizzes?topic=Math")}
                    >
                        <img src="src/images/math.jpg" alt="Math" />
                        <h2>Math</h2>
                        <p>
                            Test your arithmetic, geometry, and calculus skills with
                            our math quizzes.
                        </p>
                    </div>
                </div>
                <div className="topics-row">
                    <div
                        className="topic-card"
                        onClick={() => navigate("/quizzes?topic=GeneralKnowledge")}
                    >
                        <img src="src/images/general-knowledge.jpg" alt="General Knowledge" />
                        <h2>General Knowledge</h2>
                        <p>
                            Broaden your horizons with questions across various domains.
                        </p>
                    </div>
                    <div
                        className="topic-card"
                        onClick={() => navigate("/quizzes?topic=History")}
                    >
                        <img src="src/images/history.jpg" alt="History" />
                        <h2>History</h2>
                        <p>
                            Learn about past events, cultures, and civilizations through history.
                        </p>
                    </div>
                    <div
                        className="topic-card"
                        onClick={() => navigate("/quizzes?topic=Geography")}
                    >
                        <img src="src/images/geography.jpg" alt="Geography" />
                        <h2>Geography</h2>
                        <p>
                            Discover the physical features, climates, and cultures of our planet.
                        </p>
                    </div>
                </div>
            </main>
            <footer className="footer">
                <span className="footer-text">
                    Created by Sparky (Harshil Tanna)
                </span>
                <a
                    href="https://github.com/vSparkyy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                >
                    My GitHub
                </a>
            </footer>
        </div>
    );
}

export default Home;
