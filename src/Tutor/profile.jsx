import React, { useState } from 'react'
import SideNav from '../sidebar/sidenav'
import {
    Avatar,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    Tab,
    Tabs,
    Box,
    IconButton,
    Tooltip,
} from "@mui/material"
import {
    Search as SearchIcon,
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
    ContentCopy as ContentCopyIcon,
    CalendarToday as CalendarTodayIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material"
import "bootstrap/dist/css/bootstrap.min.css"
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { CiWallet } from "react-icons/ci";

const drawerWidth = 260;

const TutorsProfile = () => {
    const [activeTab, setActiveTab] = useState(0)
    const [searchTerm, setSearchTerm] = useState("")
    const [rowsPerPage, setRowsPerPage] = useState(50)
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

    // Form state for editable fields
    const [profileData, setProfileData] = useState({
        noOfHires: "12",
        joiningDate: "12/03/24",
        children: "2",
        amountSpent: "Rs. 150,000",
        description:
            "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
    })

    const handleSort = (key) => {
        let direction = "asc"
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
    }

    const handleInputChange = (field, value) => {
        setProfileData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return (
                <div style={{ display: "flex", flexDirection: "column", marginLeft: "4px" }}>
                    <ArrowUpwardIcon style={{ fontSize: "12px", color: "#FFFFFF", marginBottom: "-2px" }} />
                    <ArrowDownwardIcon style={{ fontSize: "12px", color: "#FFFFFF" }} />
                </div>
            )
        }

        if (sortConfig.direction === "asc") {
            return (
                <div style={{ display: "flex", flexDirection: "column", marginLeft: "4px" }}>
                    <ArrowUpwardIcon style={{ fontSize: "12px", color: "#FFFFFF", marginBottom: "-2px" }} />
                    <ArrowDownwardIcon style={{ fontSize: "12px", color: "#FFFFFF" }} />
                </div>
            )
        } else {
            return (
                <div style={{ display: "flex", flexDirection: "column", marginLeft: "4px" }}>
                    <ArrowUpwardIcon style={{ fontSize: "12px", color: "#FFFFFF", marginBottom: "-2px" }} />
                    <ArrowDownwardIcon style={{ fontSize: "12px", color: "#FFFFFF" }} />
                </div>
            )
        }
    }

    // Sample data for different tabs
    const transactionsData = [
        {
            id: 1,
            payment: { name: "Nisha Kumari", cost: "Rs. 195367" },
            child: { name: "Nisha Kumari", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 2,
            payment: { name: "Sophie", cost: "Rs. 195367" },
            child: { name: "Sophie", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 3,
            payment: { name: "Pusha Pratap", cost: "Rs. 195367" },
            child: { name: "Pusha Pratap", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 4,
            payment: { name: "Tisha Kumari", cost: "Rs. 195367" },
            child: { name: "Tisha Kumari", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 5,
            payment: { name: "Jolene Orr", cost: "Rs. 195367" },
            child: { name: "Jolene Orr", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 6,
            payment: { name: "Aryan Roy", cost: "Rs. 195367" },
            child: { name: "Aryan Roy", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 7,
            payment: { name: "Raj Singh", cost: "Rs. 195367" },
            child: { name: "Raj Singh", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 8,
            payment: { name: "Nazaifa Anas", cost: "Rs. 195367" },
            child: { name: "Nazaifa Anas", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
        {
            id: 9,
            payment: { name: "Nisha Kumari", cost: "Rs. 195367" },
            child: { name: "Nisha Kumari", avatar: "/placeholder.svg?height=32&width=32" },
            pay: 12345678,
            paymentMethod: { type: "bank", accountNumber: "1234567890123456" },
            transactionDate: "12/03/2024",
        },
    ]

    const childrenData = [
        {
            id: 1,
            childName: "Ali Hassan",
            grade: "7th Grade",
            tutorHired: "Yes",
            currentTutors: "Amir Ali",
        },
        {
            id: 2,
            childName: "Sara Ahmed",
            grade: "5th Grade",
            tutorHired: "No",
            currentTutors: "-",
        },
        {
            id: 3,
            childName: "Ahmed Khan",
            grade: "8th Grade",
            tutorHired: "Yes",
            currentTutors: "Maria Khan, John Smith",
        },
        {
            id: 4,
            childName: "Fatima Ali",
            grade: "6th Grade",
            tutorHired: "Yes",
            currentTutors: "Sarah Johnson",
        },
    ]

    const notesByTutorsData = [
        {
            id: 1,
            note: "Note #11227289",
            fromTutor: { name: "Amir Ali", avatar: "/placeholder.svg?height=32&width=32" },
            toChild: { name: "ali", avatar: "/placeholder.svg?height=32&width=32" },
            date: "12/03/20247",
        },
        {
            id: 2,
            note: "Note #11222323",
            fromTutor: { name: "Amir Ali", avatar: "/placeholder.svg?height=32&width=32" },
            toChild: { name: "ABC", avatar: "/placeholder.svg?height=32&width=32" },
            date: "12/03/20247",
        },
    ]

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const renderTableContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <TableContainer component={Paper} style={{ boxShadow: "none", border: "1px solid #E0E3EB", borderRadius: '8px' }}>
                        <Table style={{ border: "1px solid #e0e0e0" }}>
                            <TableHead sx={{ backgroundColor: "#1E9CBC", height: 32 }}>
                                <TableRow sx={{
                                    '& th': {
                                        height: '32px',
                                        paddingTop: '0px',
                                        paddingBottom: '0px',
                                        lineHeight: '32px',
                                        backgroundColor: '#1E9CBC',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        border: '1px solid #4db6ac',
                                    },
                                }}>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Payment To
                                            {getSortIcon('name')}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Cost
                                            {getSortIcon("cost")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Payment
                                            {getSortIcon("payment")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Payment Method
                                            {getSortIcon("paymentMethod")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Transaction Date
                                            {getSortIcon("transactionDate")}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactionsData.map((row) => (
                                    <TableRow key={row.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <img
                                                src="https://png.pngtree.com/png-clipart/20220821/ourmid/pngtree-male-profile-picture-icon-and-png-image-png-image_6118773.png"
                                                alt="Teacher"
                                                style={{ width: 32, height: 32, borderRadius: "50%" }}
                                            />
                                            <span style={{ fontSize: "16px", fontWeight: 400, color: '#101219', marginLeft: '5px' }}>{row.payment.name}</span>
                                        </TableCell>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <span style={{ fontSize: "16px", fontWeight: 400, color: '#101219', }}>{row.payment.cost}</span>
                                        </TableCell>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <span
                                                style={{
                                                    fontSize: "16px",
                                                    fontWeight: 400,
                                                    color: row.id % 2 !== 0 ? "#38BC5C" : "#F31616", // Green for odd IDs, red for even
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                {row.id % 2 !== 0 ? (
                                                    <ArrowDropUpIcon style={{ fontSize: "18px" }} />
                                                ) : (
                                                    <ArrowDropDownIcon style={{ fontSize: "18px" }} />
                                                )}
                                                {row.pay.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                    <img
                                                        src="https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e2/75/5f/e2755f3b-22fc-2929-4619-2fe03c47e635/AppIcon-1x_U007emarketing-0-6-0-sRGB-85-220-0.png/256x256bb.jpg"
                                                        alt="Meezan Bank"
                                                        style={{ width: 32, height: 32, borderRadius: "50%" }}
                                                    />
                                                    <span style={{ fontSize: "16px", fontWeight: 400, color: "#101219" }}>
                                                        ****{row.paymentMethod.accountNumber.slice(-4)}
                                                    </span>
                                                </div>
                                                <Tooltip title="Copy Account Number">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopy(row.paymentMethod.accountNumber)}
                                                        style={{ padding: "1px", width: 20, height: 20 }}
                                                    >
                                                        <ContentCopyIcon style={{ color: "#A6ADBF" }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ fontSize: "16px", fontWeight: 400, color: '#4D5874', border: "1px solid #e0e0e0" }}>
                                            {row.transactionDate}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )

            case 1:
                return (
                    <TableContainer component={Paper} style={{ boxShadow: "none", border: "1px solid #E0E3EB", borderRadius: '8px' }}>
                        <Table style={{ border: "1px solid #e0e0e0" }}>
                            <TableHead sx={{ backgroundColor: "#1E9CBC", height: 32 }}>
                                <TableRow sx={{
                                    '& th': {
                                        height: '32px',
                                        paddingTop: '0px',
                                        paddingBottom: '0px',
                                        lineHeight: '32px',
                                        backgroundColor: '#1E9CBC',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        border: '1px solid #4db6ac',
                                    },
                                }}>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Received From
                                            {getSortIcon("childName")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Payment
                                            {getSortIcon("grade")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            From Year
                                            {getSortIcon("tutorHired")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            To Year
                                            {getSortIcon("currentTutors")}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {childrenData.map((row) => (
                                    <TableRow key={row.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <img
                                                src="https://png.pngtree.com/png-clipart/20220821/ourmid/pngtree-male-profile-picture-icon-and-png-image-png-image_6118773.png"
                                                alt="Teacher"
                                                style={{ width: 32, height: 32, borderRadius: "50%" }}
                                            />
                                            <span style={{ fontSize: "16px", fontWeight: 400, color: '#101219', marginLeft: '5px' }}>{row.childName}</span>
                                        </TableCell>
                                        <TableCell style={{ fontSize: "16px", color: '#101219', fontWeight: 400, border: "1px solid #e0e0e0" }}>{row.grade}</TableCell>
                                        <TableCell
                                            style={{
                                                fontSize: "16px",
                                                border: "1px solid #e0e0e0",
                                                color: row.tutorHired === "Yes" ? "#4caf50" : "#f44336",
                                                fontWeight: "400",
                                            }}
                                        >
                                            {row.tutorHired}
                                        </TableCell>
                                        <TableCell style={{ fontSize: "16px", color: '#101219', fontWeight: 400, border: "1px solid #e0e0e0" }}>{row.currentTutors}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )

            case 2:
                return (
                    <TableContainer component={Paper} style={{ boxShadow: "none", border: "1px solid #E0E3EB", borderRadius: '8px' }}>
                        <Table style={{ border: "1px solid #e0e0e0" }}>
                            <TableHead style={{ backgroundColor: "#1E9CBC" }}>
                                <TableRow sx={{
                                    '& th': {
                                        height: '32px',
                                        paddingTop: '0px',
                                        paddingBottom: '0px',
                                        lineHeight: '32px',
                                        backgroundColor: '#1E9CBC',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        border: '1px solid #4db6ac',
                                    },
                                }}>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Note
                                            {getSortIcon("note")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            From Tutor
                                            {getSortIcon("fromTutor")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            To Child
                                            {getSortIcon("toChild")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Date
                                            {getSortIcon("date")}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notesByTutorsData.map((row) => (
                                    <TableRow key={row.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        backgroundColor: "#3f51b5",
                                                        borderRadius: "4px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ color: "white", fontSize: "12px", fontWeight: "bold" }}>N</span>
                                                </div>
                                                <span style={{ fontSize: "16px", fontWeight: 400, color: '#101219' }}>{row.note}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <Avatar src={row.fromTutor.avatar} style={{ width: 24, height: 24 }} />
                                                <span style={{ fontSize: "16px", fontWeight: 400, color: '#4D5874' }}>{row.fromTutor.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <Avatar src={row.toChild.avatar} style={{ width: 24, height: 24 }} />
                                                <span style={{ fontSize: "16px", fontWeight: 400, color: '#4D5874' }}>{row.toChild.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ fontSize: "16px", fontWeight: 400, color: '#4D5874', border: "1px solid #e0e0e0" }}>{row.date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )

            case 3:
                return (
                    <TableContainer component={Paper} style={{ boxShadow: "none", border: "1px solid #E0E3EB", borderRadius: '8px' }}>
                        <Table style={{ border: "1px solid #e0e0e0" }}>
                            <TableHead style={{ backgroundColor: "#1E9CBC" }}>
                                <TableRow sx={{
                                    '& th': {
                                        height: '32px',
                                        paddingTop: '0px',
                                        paddingBottom: '0px',
                                        lineHeight: '32px',
                                        backgroundColor: '#1E9CBC',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        border: '1px solid #4db6ac',
                                    },
                                }}>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Note
                                            {getSortIcon("note")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            From Tutor
                                            {getSortIcon("fromTutor")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            To Child
                                            {getSortIcon("toChild")}
                                        </Box>
                                    </TableCell>
                                    <TableCell onClick={() => handleSort('name')}>
                                        <Box sx={{ display: 'flex', fontWeight: 500, fontSize: '14px', color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Date
                                            {getSortIcon("date")}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notesByTutorsData.map((row) => (
                                    <TableRow key={row.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        backgroundColor: "#3f51b5",
                                                        borderRadius: "4px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ color: "white", fontSize: "12px", fontWeight: "bold" }}>N</span>
                                                </div>
                                                <span style={{ fontSize: "16px", fontWeight: 400, color: '#101219' }}>{row.note}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <Avatar src={row.fromTutor.avatar} style={{ width: 24, height: 24 }} />
                                                <span style={{ fontSize: "16px", fontWeight: 400, color: '#4D5874' }}>{row.fromTutor.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ border: "1px solid #e0e0e0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <Avatar src={row.toChild.avatar} style={{ width: 24, height: 24 }} />
                                                <span style={{ fontSize: "16px", fontWeight: 400, color: '#4D5874' }}>{row.toChild.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ fontSize: "16px", fontWeight: 400, color: '#4D5874', border: "1px solid #e0e0e0" }}>{row.date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )

            default:
                return null
        }
    }
    return (
        <>
            <SideNav />
            <div
                style={{
                    marginLeft: `${drawerWidth}px`,
                    transition: "margin-left 0.3s ease-in-out",
                    marginTop: '4rem',
                }}>
                <div className="container-fluid" style={{ minHeight: "100vh", padding: "20px" }}>
                    <div className="row" style={{ padding: "20px" }}>
                        <div className="col-12">
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                                <ArrowBackIcon style={{ marginRight: "10px", color: "#A6ADBF", width: 20, height: 20 }} />
                                <h4 style={{ margin: 0, fontWeight: 600, fontSize: "20px", color: "#101219" }}>PA-112324</h4>
                            </div>


                            <div
                                style={{
                                    backgroundColor: "#EEFBFD",
                                    borderRadius: "8px",
                                    padding: "20px",
                                    marginBottom: "20px",
                                    border: "1px solid #D1D1DB",
                                }}
                            >
                                <div className="row align-items-start">
                                    <div className="col-md-8">
                                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                            <div style={{ position: "relative" }}>
                                                <Avatar src="/placeholder.svg?height=60&width=60" style={{ width: 60, height: 60 }} />
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        bottom: "-2px",
                                                        right: "-2px",
                                                        width: "20px",
                                                        height: "20px",
                                                        backgroundColor: "#4caf50",
                                                        borderRadius: "50%",
                                                        border: "2px solid white",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ color: "white", fontSize: "12px" }}>✓</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 style={{ margin: 0, fontWeight: 500, color: "#121217", fontSize: "24px" }}>Ahamad Saeed</h5>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginTop: "10px" }}>
                                            <span style={{ fontSize: "18px", fontWeight: 500, color: "#121217" }}>Tutor Status</span>
                                            <Chip
                                                label="Verified"
                                                size="small"
                                                style={{
                                                    backgroundColor: "#EEFBF4",
                                                    border: "1px solid #B2EECC",
                                                    color: "#17663A",
                                                    fontWeight: 400,
                                                    fontSize: "14px",
                                                    padding: "4px 8px",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4 d-flex justify-content-end align-items-start">
                                        {activeTab === 0 && (
                                            <Button
                                                variant="contained"
                                                startIcon={
                                                    <CiWallet style={{ color: 'white', fontWeight: 900, fontSize: '20px' }} />
                                                }
                                                style={{
                                                    marginRight: '2rem',
                                                    backgroundColor: "#121217",
                                                    borderRadius: "8px",
                                                    color: "white",
                                                    textTransform: "none",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                Rs 1928
                                            </Button>
                                        )}
                                        <Button
                                            variant="contained"
                                            startIcon={<EditIcon />}
                                            style={{
                                                backgroundColor: "#1E9CBC",
                                                borderRadius: "8px",
                                                color: "white",
                                                textTransform: "none",
                                                fontSize: "14px",
                                            }}
                                        >
                                            Edit Details
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats Row with Input Fields */}
                                <div className="row mt-5">
                                    <div className="col-3">
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 500, color: "#80878A", marginBottom: "5px" }}>No. of Hires</div>
                                            <TextField
                                                value={profileData.noOfHires}
                                                onChange={(e) => handleInputChange("noOfHires", e.target.value)}
                                                variant="outlined"
                                                size="small"
                                                style={{ width: "100%" }}
                                                InputProps={{
                                                    style: { fontSize: "14px", color: '#80878A', backgroundColor: "#F7FDFE" },
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 500, color: "#80878A", marginBottom: "5px" }}>Joining Date</div>
                                            <TextField
                                                value={profileData.joiningDate}
                                                onChange={(e) => handleInputChange("joiningDate", e.target.value)}
                                                variant="outlined"
                                                size="small"
                                                style={{ width: "100%" }}
                                                InputProps={{
                                                    style: { fontSize: "14px", color: '#80878A', backgroundColor: "#F7FDFE" },
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <CalendarTodayIcon style={{ fontSize: "14px", color: '#80878A', backgroundColor: "#F7FDFE" }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 500, color: "#80878A", marginBottom: "5px" }}>Experience (Years)</div>
                                            <TextField
                                                value={profileData.children}
                                                onChange={(e) => handleInputChange("children", e.target.value)}
                                                variant="outlined"
                                                size="small"
                                                style={{ width: "100%" }}
                                                InputProps={{
                                                    style: { fontSize: "14px", color: '#80878A', backgroundColor: "#F7FDFE" },
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 500, color: "#80878A", marginBottom: "5px" }}>Total Jobs Done</div>
                                            <TextField
                                                value={profileData.amountSpent}
                                                onChange={(e) => handleInputChange("amountSpent", e.target.value)}
                                                variant="outlined"
                                                size="small"
                                                style={{ width: "100%" }}
                                                InputProps={{
                                                    style: { fontSize: "14px", color: '#80878A', backgroundColor: "#F7FDFE" },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description with Textarea */}
                                <div style={{ marginTop: "2rem", marginBottom: '1rem' }}>
                                    <h6 style={{ fontWeight: 600, fontSize: '14px', color: "#121217", marginBottom: "10px" }}>Description</h6>
                                    <TextField
                                        value={profileData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        variant="outlined"
                                        multiline
                                        rows={4}
                                        style={{ width: "100%" }}
                                        InputProps={{
                                            style: { fontSize: "14px", fontWeight: 400, color: '#30417D', borderRadius: '8px', backgroundColor: "#FFFFFF", lineHeight: "1.5" },
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Project Details */}
                            <div style={{ paddingTop: "10px" }}>
                                <h6 style={{ fontWeight: 500, color: "#121217", fontSize: '20px', marginBottom: "20px" }}>Project Details</h6>

                                {/* Tabs */}
                                <Box
                                    sx={{
                                        border: "1px solid #D1D1DB",
                                        borderRadius: "8px",
                                        marginBottom: "20px",
                                        width: '48%'
                                    }}
                                >
                                    <Tabs
                                        value={activeTab}
                                        onChange={handleTabChange}
                                        sx={{
                                            "& .MuiTab-root": {
                                                textTransform: "none",
                                                fontSize: "14px",
                                                fontWeight: "normal",
                                                color: "#666",
                                                minHeight: "40px",
                                                borderRight: "1px solid #D1D1DB", // border between tabs
                                                paddingX: 2, // optional spacing
                                                "&:last-of-type": {
                                                    borderRight: "none", // remove right border from last tab
                                                },
                                            },
                                            "& .Mui-selected": {
                                                color: "#1E9CBC !important",
                                                fontWeight: 500,
                                                fontSize: 14
                                            },
                                            "& .MuiTabs-indicator": {
                                                backgroundColor: "#1E9CBC",
                                            },
                                        }}
                                    >
                                        <Tab label="Transactions" />
                                        <Tab label="Experience" />
                                        <Tab label="Documents 36" />
                                        <Tab label="Education 36" />
                                    </Tabs>
                                </Box>

                                {/* Search and Filter Row */}
                                <div className="row align-items-center mb-3">
                                    <div className="col-md-6">
                                        <TextField
                                            placeholder="Search"
                                            variant="outlined"
                                            size="small"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            InputProps={{

                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <SearchIcon style={{ color: "#8A8AA3" }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            style={{ width: "230px" }}
                                        />
                                    </div>
                                    <div className="col-md-6 text-end">
                                        <FormControl size="small" style={{ minWidth: "80px" }}>
                                            <Select
                                                value={rowsPerPage}
                                                onChange={(e) => setRowsPerPage(e.target.value)}
                                                displayEmpty
                                                sx={{
                                                    fontSize: "14px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    "& .MuiSelect-select": {
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px", // space between text and icon
                                                    },
                                                    "& .MuiSelect-icon": {
                                                        marginRight: "4px", // optional: adjust icon alignment
                                                    }
                                                }}
                                            >
                                                <MenuItem value={50}>50</MenuItem>
                                                <MenuItem value={100}>100</MenuItem>
                                                <MenuItem value={200}>200</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>
                                </div>

                                {/* Table Content */}
                                {renderTableContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TutorsProfile
