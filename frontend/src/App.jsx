import react from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Quiz from "./pages/Quiz";
import QuizSelection from "./pages/QuizSelection";
import Results from "./pages/Results";
import PrivateRoute from "./components/PrivateRoute";
import AdminPanel from "./pages/AdminPanel";
import CompletedQuizzes from "./pages/CompletedQuizzes";

function Logout() {
    localStorage.clear();
    return <Navigate to="/login" />;
}

function RegisterAndLogout() {
    localStorage.clear();
    return <Register />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/quiz"
                    element={
                        <ProtectedRoute>
                            <Quiz />
                        </ProtectedRoute>
                    }
                />
				<Route
					path="/quizzes"
					element={
						<ProtectedRoute>
							<QuizSelection />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/results"
					element={
						<ProtectedRoute>
							<Results />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/completed-quizzes"
					element={
						<ProtectedRoute>
							<CompletedQuizzes />
						</ProtectedRoute>
					}
				/>
				<Route element={<PrivateRoute />}>
                    <Route path="/admin" element={<AdminPanel />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterAndLogout />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/home" element={<Home />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
