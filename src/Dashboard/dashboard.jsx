import React, { useState } from 'react'
import SideNav from '../sidebar/sidenav'
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Select,
    MenuItem,
    FormControl,
    LinearProgress,
    InputAdornment,
    Chip,
    Divider,
    Paper,
    TextField,
    TableContainer,
    TableCell,
    TableHead,
    TableRow,
    TableBody,
    Table,
    Avatar,
    IconButton
} from "@mui/material"
import fileicon from "../assets/file.png";
import editicon from "../assets/edit.png";
import DateRangeIcon from '@mui/icons-material/DateRange';
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { TrendingUp, TrendingDown, FileDownload, Visibility, Edit, Search, KeyboardArrowDown, Add, Person, School, PersonOff, Group, } from "@mui/icons-material"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const drawerWidth = 260;
const performanceData = [
    { name: "Jan", value: 65 },
    { name: "Feb", value: 75 },
    { name: "Mar", value: 85 },
    { name: "Apr", value: 70 },
    { name: "May", value: 90 },
    { name: "Jun", value: 80 },
    { name: "Jul", value: 85 },
    { name: "Aug", value: 75 },
    { name: "Sep", value: 70 },
    { name: "Oct", value: 60 },
    { name: "Nov", value: 55 },
    { name: "Dec", value: 45 },
]

// Sample data for the pie chart
const jobData = [
    { name: "Active", value: 15, color: "#00bcd4" },
    { name: "Completed", value: 20, color: "#4caf50" },
    { name: "Remaining", value: 738, color: "#e0e0e0" },
]

const Dashboard = () => {
    const [timeFilter, setTimeFilter] = useState("Last 7 Days")
    const [weekFilter, setWeekFilter] = useState("Week")
    const [searchQuery, setSearchQuery] = useState("")
    const [jobTitleFilter, setJobTitleFilter] = useState("All Job Titles")
    const [statusFilter, setStatusFilter] = useState("All Status")

    const employees = [
        {
            id: 1,
            name: "Rudra Pratap",
            email: "rudra@brinul.com",
            jobTitle: "UX/UI Designer",
            status: "ACTIVE",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 2,
            name: "Nisha Kumari",
            email: "nisha.kumari@brinul.com",
            jobTitle: "Graphic Designer",
            status: "ACTIVE",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 3,
            name: "Aryan Roy",
            email: "aryan.roy@brinul.com",
            jobTitle: "UX/UI Designer",
            status: "PROBATION",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 4,
            name: "Sophia",
            email: "sophia@brinul.com",
            jobTitle: "UX/UI Designer",
            status: "ON BOARDING",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 5,
            name: "Koen Chegg",
            email: "koen.chegg@brinul.com",
            jobTitle: "UX/UI Designer",
            status: "PENDING",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 6,
            name: "Kim Armstrong",
            email: "kim.armstrong@brinul.com",
            jobTitle: "UX/UI Designer",
            status: "RESIGN",
            avatar: "/placeholder.svg?height=40&width=40",
        },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return { bgcolor: "#e8f5e8", color: "#2e7d32" }
            case "PROBATION":
                return { bgcolor: "#e3f2fd", color: "#1976d2" }
            case "ON BOARDING":
                return { bgcolor: "#fff3e0", color: "#f57c00" }
            case "PENDING":
                return { bgcolor: "#e3f2fd", color: "#1976d2" }
            case "RESIGN":
                return { bgcolor: "#ffebee", color: "#d32f2f" }
            default:
                return { bgcolor: "#f5f5f5", color: "#666" }
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "●"
            case "PROBATION":
                return "●"
            case "ON BOARDING":
                return "●"
            case "PENDING":
                return "●"
            case "RESIGN":
                return "●"
            default:
                return "●"
        }
    }

    const MetricCard = ({ title, value, change, changeType, icon: Icon }) => {
        const isUp = changeType === "up";
        const changeColor = isUp ? "#38BC5C" : "#F31616";

        return (
            <Paper
                elevation={0}
                sx={{
                    border: "1px solid #E0E3EB",
                    borderRadius: "12px",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    height: "100%",
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Icon fontSize="small" color="action" />
                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#101219' }}>
                        {title}
                    </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{
                    mt: 2
                }}>
                    {/* Left: Value */}
                    <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#101219' }}>
                        {value.toLocaleString()}
                    </Typography>

                    {/* Right: Change indicator and "Last year" */}
                    <Box display="flex" alignItems="center" gap={0.5}>
                        {isUp ? (
                            <ArrowDropUpIcon sx={{ color: changeColor, fontSize: 20 }} />
                        ) : (
                            <ArrowDropDownIcon sx={{ color: changeColor, fontSize: 20 }} />
                        )}
                        <Typography sx={{ color: changeColor, fontSize: 14 }}>{change}</Typography>
                        <Typography sx={{
                            color: '#4D5874',
                            fontWeight: 400,
                            fontSize: 14
                        }}>
                            Last year
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        );
    };

    return (
        <>
            <SideNav />
            <div
                style={{
                    marginLeft: `${drawerWidth}px`,
                    transition: "margin-left 0.3s ease-in-out",
                    marginTop: '4rem',
                }}>
                <Box sx={{ flexGrow: 1, py: 2, bgcolor: "#FFFFFF" }}>
                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        {/* Top Left: Title + Chip */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 3, mb: 1.5 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '18px' }}>
                                Overview
                            </Typography>
                            <Chip label="Updated" size="medium" sx={{ borderRadius: '8px', bgcolor: "#FFFFFF", color: "#4D5874", border: '1px solid #E0E3EB' }} />
                        </Box>
                        <Divider sx={{ mb: 2, color: "#F3F5F7" }} />
                        <Box sx={{ px: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                            {/* Left Side: Today + Dropdown */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid #E0E3EB",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                }}
                            >
                                {/* "Today" label */}
                                <Box sx={{ px: 2, py: 0.8 }}>
                                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#4D5874' }}>
                                        Today
                                    </Typography>
                                </Box>

                                {/* Vertical divider */}
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: "#E0E3EB" }} />

                                {/* Dropdown */}
                                <DateRangeIcon style={{
                                    width: 20,
                                    height: 20,
                                    color: '#A6ADBF',
                                    marginLeft: 5
                                }} />
                                <FormControl size="small" sx={{ px: 0.7 }}>
                                    <Select
                                        value={timeFilter}
                                        onChange={(e) => setTimeFilter(e.target.value)}
                                        disableUnderline
                                        variant="standard"
                                        sx={{
                                            minWidth: 120,
                                            '& .MuiSelect-select': {
                                                padding: 0,
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                color: '#4D5874',
                                            },
                                        }}
                                    >
                                        <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
                                        <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
                                        <MenuItem value="Last 90 Days">Last 90 Days</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Right Side: Add New Button */}
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                sx={{
                                    width: 118,
                                    height: 36,
                                    borderRadius: '8px',
                                    bgcolor: "#1E9CBC",
                                    "&:hover": { bgcolor: "#1E9CBC" },
                                    textTransform: "none",
                                }}
                            >
                                Add New
                            </Button>
                        </Box>
                    </Box>

                    {/* Metrics Cards */}
                    <Box
                        sx={{
                            display: 'flex',
                            // flexWrap: 'wrap',
                            gap: 2,
                            px: 3,
                            mb: 3,
                        }}
                    >
                        <Box sx={{ width: 250 }}>
                            <MetricCard title="Total Users" value={3540} change="+13%" changeType="up" icon={Group} />
                        </Box>
                        <Box sx={{ width: 250 }}>
                            <MetricCard title="Parents" value={874} change="+12%" changeType="up" icon={Person} />
                        </Box>
                        <Box sx={{ width: 250 }}>
                            <MetricCard title="Tutors" value={874} change="-12%" changeType="down" icon={School} />
                        </Box>
                        <Box sx={{ width: 250 }}>
                            <MetricCard title="Terminated Users" value={29} change="+132%" changeType="up" icon={PersonOff} />
                        </Box>
                    </Box>

                    {/* Charts Section */}
                    <Box sx={{
                        width: '100%',
                        px: 3
                    }}>
                        <Grid container spacing={2}>
                            {/* Performance Team Chart */}
                            <Grid item xs={12} md={9}
                                sx={{
                                    width: '65%',
                                }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: 400,
                                        width: '100%',
                                        border: '1px solid #E0E3EB',
                                        borderRadius: '12px',
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#101219' }}>
                                                Performance Team
                                            </Typography>
                                            <FormControl
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '8px',
                                                        '& fieldset': {
                                                            border: '1px solid #D4D8E2',
                                                        },
                                                        '&:hover fieldset': {
                                                            border: '1px solid #D4D8E2',
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            border: '1px solid #D4D8E2',
                                                        },
                                                    },
                                                }}
                                            >
                                                <Select
                                                    value={weekFilter}
                                                    onChange={(e) => setWeekFilter(e.target.value)}
                                                >
                                                    <MenuItem value="Week">Week</MenuItem>
                                                    <MenuItem value="Month">Month</MenuItem>
                                                    <MenuItem value="Year">Year</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={performanceData}>
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#4caf50"
                                                    strokeWidth={2}
                                                    fill="#4caf50"
                                                    fillOpacity={0.1}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Right Side Cards */}
                            <Grid item xs={12} md={3} sx={{
                                width: '33.1%'
                            }}>
                                {/* <Grid container spacing={2}> */}
                                {/* Total Users Progress */}
                                <Grid item xs={12}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: 180,
                                            width: '100%',
                                            border: '1px solid #E0E3EB',
                                            borderRadius: '12px',
                                            p: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                mb: 2,
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#101219' }}>
                                                Total Users
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <TrendingUp sx={{ fontSize: 16, color: '#38BC5C' }} />
                                                <Typography sx={{ color: '#38BC5C', fontWeight: 400, fontSize: '14px' }}>
                                                    +12%
                                                </Typography>
                                                <Typography sx={{ color: '#4D5874', fontWeight: 400, fontSize: '14px' }}>
                                                    Last month
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 1.5,
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 600, fontSize: 20, color: '#101219' }}>
                                                80%
                                            </Typography>
                                            <Typography sx={{ fontWeight: 500, fontSize: 14, color: '#101219' }}>
                                                2310
                                            </Typography>
                                        </Box>

                                        {/* Combined Progress Bar */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                height: 20,
                                                width: '100%',
                                                overflow: 'hidden',
                                                borderRadius: 1,
                                                mb: 1.5,
                                            }}
                                        >
                                            <Box sx={{ width: '40%', backgroundColor: '#25A798' }} />
                                            <Box sx={{ width: '40%', backgroundColor: '#1E9CBC' }} />
                                            <Box sx={{ width: '20%', backgroundColor: '#C8CDDA' }} />
                                        </Box>

                                        {/* Legend */}
                                        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#25A798' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Tutors
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1E9CBC' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Parents
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#C8CDDA' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Offloaded
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>

                                {/* Job Summary */}
                                <Grid item xs={12} sx={{ mt: 2.3 }}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: 200,
                                            width: '100%',
                                            border: '1px solid #E0E3EB',
                                            borderRadius: '12px',
                                            p: 2
                                        }}
                                    >
                                        <CardContent sx={{ p: 0 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#101219' }}>
                                                    Job Summary
                                                </Typography>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <TrendingUp sx={{ fontSize: 16, color: "#4caf50", mr: 0.5 }} />
                                                    <Typography sx={{ color: '#38BC5C', fontWeight: 400, fontSize: '14px' }}>
                                                        +5.5%
                                                    </Typography>
                                                    <Typography sx={{ color: '#4D5874', fontWeight: 400, fontSize: '14px' }}>
                                                        Last month
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <Box sx={{ position: "relative", width: 120, height: 80 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={jobData}
                                                                cx="50%"
                                                                cy="100%" // position bottom for semi-circle
                                                                innerRadius={30}
                                                                outerRadius={50}
                                                                startAngle={180}
                                                                endAngle={0}
                                                                dataKey="value"
                                                            >
                                                                {jobData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: "60%",
                                                            left: "50%",
                                                            transform: "translate(-50%, -50%)",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                                                            773
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Total
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box>
                                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, bgcolor: "#00bcd4", borderRadius: "50%", mr: 1 }} />
                                                        <Typography sx={{
                                                            fontWeight: 400, fontSize: 12, color: '#4D5874'
                                                        }}>Active</Typography>
                                                        <Typography sx={{ ml: 2, fontWeight: 500, fontSize: 12, color: '#101219' }}>
                                                            15
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        <Box sx={{ width: 8, height: 8, bgcolor: "#4caf50", borderRadius: "50%", mr: 1 }} />
                                                        <Typography sx={{
                                                            fontWeight: 400, fontSize: 12, color: '#4D5874'
                                                        }}>Completed</Typography>
                                                        <Typography sx={{ ml: 2, fontWeight: 500, fontSize: 12, color: '#101219' }}>
                                                            20
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                {/* </Grid> */}
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{ mx: 3, p: 3, mt: 2, border: "1px solid #E0E3EB", borderRadius: '12px' }}>
                        {/* Header */}
                        <Box sx={{ mb: 3 }}>
                            {/* Heading and Controls Row */}
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap", // allows wrapping on small screens
                                    gap: 2,
                                    mb: 3,
                                }}
                            >
                                {/* Heading */}
                                <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#101219', minWidth: 100 }}>
                                    Employee
                                </Typography>

                                {/* Controls */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                    {/* Search */}
                                    <TextField
                                        placeholder="Search"
                                        size="small"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        sx={{
                                            minWidth: 200,
                                            '& .MuiOutlinedInput-root': {
                                                height: 32,
                                                fontSize: 14,
                                            },
                                            '& .MuiOutlinedInput-input': {
                                                padding: '2px 2px',
                                            },
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search sx={{ color: "#999", fontSize: 20 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {/* Job Title Filter */}
                                    <FormControl
                                        size="small"
                                        sx={{
                                            minWidth: 140,
                                            '& .MuiOutlinedInput-root': {
                                                height: 32,
                                                fontSize: 14,
                                                color:'#4D5874'
                                            },
                                            '& .MuiSelect-select': {
                                                display: 'flex',
                                                alignItems: 'center',
                                            },
                                        }}
                                    >
                                        <Select
                                            value={jobTitleFilter}
                                            onChange={(e) => setJobTitleFilter(e.target.value)}
                                            displayEmpty
                                            IconComponent={KeyboardArrowDown}
                                        >
                                            <MenuItem value="All Job Titles">All Job Titles</MenuItem>
                                            <MenuItem value="UX/UI Designer">UX/UI Designer</MenuItem>
                                            <MenuItem value="Graphic Designer">Graphic Designer</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {/* Status Filter */}
                                    <FormControl size="small" sx={{
                                        minWidth: 120,
                                        '& .MuiOutlinedInput-root': {
                                            height: 32,
                                            fontSize: 14,
                                            color:'#4D5874'
                                        },
                                        '& .MuiSelect-select': {
                                            display: 'flex',
                                            alignItems: 'center',
                                        },
                                    }}>
                                        <Select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            displayEmpty
                                            IconComponent={KeyboardArrowDown}
                                            sx={{
                                                "& .MuiSelect-select": {
                                                    display: "flex",
                                                    alignItems: "center",
                                                },
                                            }}
                                        >
                                            <MenuItem value="All Status">All Status</MenuItem>
                                            <MenuItem value="ACTIVE">Active</MenuItem>
                                            <MenuItem value="PROBATION">Probation</MenuItem>
                                            <MenuItem value="ON BOARDING">On Boarding</MenuItem>
                                            <MenuItem value="PENDING">Pending</MenuItem>
                                            <MenuItem value="RESIGN">Resign</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        variant="outlined"
                                        startIcon={<FileDownload />}
                                        sx={{
                                            height: 32,
                                            borderRadius: 1, // 8px if you want it consistent with other fields
                                            px: 2, // horizontal padding
                                            borderColor: "#ddd",
                                            color: "#4D5874",
                                            textTransform: "none",
                                            fontSize: 14,
                                            "&:hover": {
                                                borderColor: "#ccc",
                                                bgcolor: "#f5f5f5",
                                            },
                                        }}
                                    >
                                        Export
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        {/* Table */}
                        <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                            <Table>
                                <TableHead sx={{ bgcolor: "#F9F9FB" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 400, fontSize:14, color: "#4D5874", py: 2 }}>People</TableCell>
                                        <TableCell sx={{ fontWeight: 400, fontSize:14, color: "#4D5874", py: 2 }}>Email ID</TableCell>
                                        <TableCell sx={{ fontWeight: 400, fontSize:14, color: "#4D5874", py: 2 }}>Job Title</TableCell>
                                        <TableCell sx={{ fontWeight: 400, fontSize:14, color: "#4D5874", py: 2 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 400, fontSize:14, color: "#4D5874", py: 2 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {employees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell sx={{ py: 2 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                    <Avatar src={employee.avatar} sx={{ width: 40, height: 40 }} />
                                                    <Typography sx={{ fontWeight: 400, fontSize:14, color:'#101219' }}>
                                                        {employee.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography sx={{fontWeight: 400, fontSize:14, color:'#101219'}}>
                                                    {employee.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography sx={{fontWeight: 400, fontSize:14, color:'#101219'}}>{employee.jobTitle}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Chip
                                                    label={
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <span style={{ fontSize: "8px" }}>{getStatusIcon(employee.status)}</span>
                                                            {employee.status}
                                                        </Box>
                                                    }
                                                    size="small"
                                                    sx={{
                                                        ...getStatusColor(employee.status),
                                                        fontWeight: 500,
                                                        fontSize: "11px",
                                                        height: "24px",
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Box sx={{ display: "flex", gap: 1 }}>
                                                    {/* <IconButton size="small" sx={{ color: "#666" }}>
                                                        <Visibility fontSize="small" />
                                                    </IconButton> */}
                                                    <img src={fileicon} alt="" style={{width:20, height:20}}/>
                                                    {/* <IconButton size="small" sx={{ color: "#666" }}>
                                                        <Edit fontSize="small" />
                                                    </IconButton> */}
                                                    <img src={editicon} alt="" style={{width:20, height:20}}/>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            </div>
        </>
    )
}

export default Dashboard
