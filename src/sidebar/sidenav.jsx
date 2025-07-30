import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import logo from "../assets/logo.png"
import avatar from "../assets/Avatar.png"
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 260;
const selectedItem = 'Dashboard';

const menuSections = [
    {
        title: 'GENERAL',
        items: [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
            { text: 'Parents', icon: <PeopleIcon />, path: '/parent-dashboard' },
            { text: 'Tutors', icon: <CalendarTodayIcon />, path: '/tutor-dashboard' },
            { text: 'Transaction Log', icon: <ReceiptLongIcon />, path: '/transactions' },
        ],
    },
    {
        title: 'OTHERS',
        items: [
            { text: 'Setting', icon: <SettingsIcon />, path: '/settings' },
        ],
    },
];

export default function SideNav() {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: "#FFFFFF",
                    boxShadow: 'none',
                    height: '68px',
                    borderBottom: '1px solid #E0E3EB'
                }}>
                <Toolbar sx={{ minHeight: '68px', px: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box component="img" src={logo} alt="Logo" sx={{ height: 42, width: 31 }} />
                        <Box component="img" src={avatar} alt='avatar' sx={{ width: 36, height: 36 }} />
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#FFFFFF',
                        paddingTop: '16px',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    {menuSections.map((section, sectionIndex) => (
                        <Box key={section.title}>
                            <Typography
                                variant="caption"
                                sx={{
                                    px: 2,
                                    pt: sectionIndex === 0 ? 0 : 2,
                                    pb: 1,
                                    color: '#7B809A',
                                    fontWeight: 500,
                                }}
                            >
                                {section.title}
                            </Typography>
                            <List>
                                {section.items.map(({ text, icon, path }) => {
                                    const isSelected = location.pathname === path;
                                    return (
                                        <ListItem key={text} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                                            <ListItemButton
                                                onClick={() => navigate(path)}
                                                selected={isSelected}
                                                sx={{
                                                    borderRadius: '8px',
                                                    fontWeight: 500,
                                                    fontSize: '14px',
                                                    backgroundColor: isSelected ? '#1E9CBC' : 'transparent',
                                                    '&:hover': {
                                                        backgroundColor: '#1E9CBC',
                                                        '& .MuiListItemText-primary': {
                                                            color: '#FFFFFF',
                                                        },
                                                        '& .MuiListItemIcon-root': {
                                                            color: '#FFFFFF',
                                                        },
                                                    },
                                                    '&.Mui-selected': {
                                                        backgroundColor: '#1E9CBC',
                                                        '& .MuiListItemText-primary': {
                                                            color: '#FFFFFF',
                                                        },
                                                        '& .MuiListItemIcon-root': {
                                                            color: '#FFFFFF',
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: '#1E9CBC',
                                                        },
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ color: isSelected ? '#FFFFFF' : '#344767', minWidth: 32 }}>
                                                    {icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={text}
                                                    primaryTypographyProps={{
                                                        fontSize: '0.95rem',
                                                        color: isSelected ? '#FFFFFF' : '#4D5874',
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                            {sectionIndex === 0 && <Divider sx={{ mx: 2, my: 1 }} />}
                        </Box>
                    ))}
                </Box>
            </Drawer>
        </Box>
    );
}
