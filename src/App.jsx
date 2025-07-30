import React from 'react';
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard/dashboard";
import ParentDashboard from './Parents/dashboard';
import ParentsProfile from './Parents/profile';
import TutorDashboard from './Tutor/dashboard';
import TutorsProfile from './Tutor/profile';

function App() {
  return (
    <>
      <title>
        Ustaad
      </title>
      <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/parent-dashboard" element={<ParentDashboard/>} />
        <Route path="/parent-profile" element={<ParentsProfile/>} />
        <Route path="/tutor-dashboard" element={<TutorDashboard/>} />
        <Route path="/tutor-profile" element={<TutorsProfile/>} />
      </Routes>
    </>
  );
}

export default App;
