import React, { useContext, useEffect, useState } from 'react';
import {Link, NavLink, useLocation, useNavigate} from 'react-router-dom';
import {
    UserCircle,
    UserCircleGear,
    SignOut,
    X,
    List,
    ArrowCounterClockwise,
    CaretDown,
    Table, Question
} from '@phosphor-icons/react';
import {
    Button,
    Dropdown,
    Menu,
    Modal,
    Switch,
    Row,
    Col,
    Typography,
    Form,
    Input,
    Flex,
    Space,
    Select
} from 'antd';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ThemeColorContext } from '../../contexts/ThemeColorContext';
import { UserContext } from '../../contexts/UserContext';
import PrimaryManager from '../Settings/PrimaryManager';
import getMsalInstance from '../../helpers/getMsalInstance';
import oneDRAWWhiteLogo from '../../assets/img/logos/one_draw_logo_white.png';
import Pdf from '../../assets/PDF/oneDRAW User Guide.v1.pdf';
import { FOOT, INCH, METER, UnitContext } from '../../contexts/UnitContext';

const Header = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const { user, hasCapability } = useContext(UserContext);
    const [username, setUsername] = useState('User');
    const [isOpen, setIsOpen] = useState(true);
    const [isModal, setIsModal] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const instance = getMsalInstance();

    const handleSignOut = () => {
        localStorage.clear();
        instance.logoutRedirect();
    };

    useEffect(() => {
        const handleMedia = () => {
            if (window.innerWidth < 540) {
                setIsOpen(false);
            }
        };

        handleMedia();
    }, [pathname]);

    useEffect(() => {
        setUsername(user.user_name);
    }, [user]);

    const menuItems = [
        {
            key: '1',
            label: (
                <a href='#' onClick={() => setIsModal(true)}>
                    User Settings
                </a>
            ),
            icon: <UserCircleGear size={24} weight='fill' />,
        },
        {
            key: '2',
            label: (
                <Link onClick={handleSignOut}>Sign Out</Link>
            ),
            icon: <SignOut size={24} weight='fill' />
        }
    ];

    // User Settings
    const { Title } = Typography;
    const [form] = Form.useForm();

    const { theme, toggleTheme } = useContext(ThemeContext);
    const { primary, setPrimary, secondary, setSecondary } = useContext(ThemeColorContext);
    const [resetP, setResetP] = useState(true);
    const [resetS, setResetS] = useState(true);
    const { unit, roofUnit, treeUnit, setUnit, setRoofUnit, setObstructionUnit, setTreeUnit } = useContext(UnitContext);

    const resetPrimary = () => setPrimary("#538abc");
    const resetSecondary = () => setSecondary("#41539e");

    useEffect(() => {
        if (primary === "#538abc") {
            setResetP(false);
        }

        if (secondary === "#41539e") {
            setResetS(false);
        }
    }, [primary, secondary]);

    const options = [
        { value: METER, label: 'm' },
        { value: FOOT, label: 'ft' },
        { value: INCH, label: 'in' }
    ];

    const roofUnitChangeHandler = (e) => {
        const value = options.find(obj => e === obj.label).value;
        setRoofUnit(value);
        setObstructionUnit(value);
    };

    const treeUnitChangeHandler = (e) => {
        const value = options.find(obj => e === obj.label).value;
        setTreeUnit(value);
    };

    const unitChangeHandler = (e) => {
        const value = options.find(obj => e === obj.label).value;
        setUnit(value);
    };

    return (
        <>
            <header className="header">
                <Link to='/' className='header__logo'>
                    <img src={oneDRAWWhiteLogo} alt='OneDraw' />
                </Link>
                <div className={`header__dropdown ${isOpen && 'open'}`}>
                    <Button
                        onClick={toggleSidebar}
                        icon={<X size={30} weight='bold' />}
                        size='middle'
                        type='text'
                        className='header__dropdown--close'
                    />
                    <ul className='header__nav'>
                        {
                            hasCapability('Sites_Table') && <li>
                                <NavLink
                                    to='/sites'
                                    className='header__links'
                                >
                                    <Table size={24} weight='bold' />

                                    Sites
                                </NavLink>
                            </li>
                        }
                        <li>
                            <a
                                href={Pdf}
                                target="_blank"
                                rel="noreferrer"
                                className={'header__links'}
                            >
                                <Question size={24} weight='bold' />
                                Help
                            </a>

                        </li>
                    </ul>
                    <div className='header__menu'>

                        <Dropdown
                            overlay={(
                                <Menu>
                                    {menuItems.map(item => (
                                        <Menu.Item key={item.key} icon={item.icon}>
                                            {item.label}
                                        </Menu.Item>
                                    ))}
                                </Menu>
                            )}
                            placement='bottomLeft'
                        >
                            <Button
                                icon={<UserCircle size={28} weight='fill' />}
                                size='middle'
                                type='text'
                                onClick={(e) => e.preventDefault()}
                                className='header__menu--item'
                            >{username !== '' ? username : 'User'}</Button>
                        </Dropdown>
                    </div>
                </div>
                <Button
                    onClick={toggleSidebar}
                    icon={<List size={30} weight='bold' />}
                    size='middle'
                    type='primary'
                    className='header__toggle'
                />
            </header>

            {/* User Settings Modal */}
            <Modal
                open={isModal}
                onOk={() => setIsModal(false)}
                onCancel={() => setIsModal(false)}
                centered
                footer={[]}
            >
                <Row gutter={[30, 30]}>
                    <Col xxl={12} xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Title level={4} style={{ marginBottom: 30 }}>User Profile</Title>
                        <Form
                            form={form}
                            name='profile'
                            layout='vertical'
                            size='large'
                        >
                            <Form.Item label='Employee ID' name='employeeId'>
                                <Input
                                    type='text'
                                    placeholder={user.user_Id}
                                    disabled
                                />
                            </Form.Item>
                            <Form.Item label='Name' name='name'>
                                <Input
                                    type='text'
                                    placeholder={user.user_name}
                                    disabled
                                />
                            </Form.Item>
                            <Form.Item label='User Role' name='userRole'>
                                <Input
                                    type='text'
                                    placeholder={user.application_role_name}
                                    disabled
                                />
                            </Form.Item>
                            <Form.Item label='Email Address' name='email' style={{ margin: 0 }}>
                                <Input
                                    type='text'
                                    placeholder={user.email}
                                    disabled
                                />
                            </Form.Item>
                        </Form>
                    </Col>
                    <Col xxl={12} xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Title level={4} style={{ marginBottom: 30 }}>Settings</Title>
                        <Space direction='vertical' block size='large'>
                            <Flex align='center' justify='space-between'>
                                <div>
                                    <h4 className='form-group form-label'>Dark Mode</h4>
                                    <span className='settings__meta form-group form-label'>Toggle the Dark Theme.</span>
                                </div>
                                <Switch
                                    checked={theme === 'dark' ? true : false}
                                    onClick={toggleTheme}
                                />
                            </Flex>
                            <Flex align='center' justify='space-between'>
                                <div>
                                    <h4 className='form-group form-label'>Primary Color</h4>
                                    <span className='settings__meta form-group form-label'>Change your system primary color.</span>
                                </div>
                                <Space>
                                    <PrimaryManager />
                                    {resetP && (
                                        <Button
                                            type='default'
                                            size='middle'
                                            icon={<ArrowCounterClockwise size={24} />}
                                            onClick={resetPrimary}
                                        />
                                    )}
                                </Space>
                            </Flex>
                            {/* <Flex align='center' justify='space-between'>
                                <div>
                                    <h4 className='form-group form-label'>Secondary Color</h4>
                                    <span className='settings__meta form-group form-label'>Change your system secondary color.</span>
                                </div>
                                <Space>
                                    <SecondaryManager />
                                    {resetS && (
                                        <Button
                                            type='default'
                                            size='middle'
                                            icon={<ArrowCounterClockwise size={24} />}
                                            onClick={resetSecondary}
                                        />
                                    )}
                                </Space>
                            </Flex> */}
                            <Flex align='center' justify='space-between'>
                                <div>
                                    <h4 className='form-group form-label'>Unit of Measurement</h4>
                                </div>
                                <div>
                                    <span className='settings__meta form-group form-label'>Roof</span>
                                    <Select
                                        placeholder='Select Unit'
                                        options={options}
                                        defaultValue={roofUnit}
                                        onChange={roofUnitChangeHandler}
                                        size='large'
                                        suffixIcon={<CaretDown size={18} />}
                                        style={{ width: 75 }}
                                        loading
                                    />
                                </div>
                                <div>
                                    <span className='settings__meta form-group form-label'>Tree</span>
                                    <Select
                                        placeholder='Select Unit'
                                        options={options}
                                        defaultValue={treeUnit}
                                        onChange={treeUnitChangeHandler}
                                        size='large'
                                        suffixIcon={<CaretDown size={18} />}
                                        style={{ width: 75 }}
                                        loading
                                    />
                                </div>
                                <div>
                                    <span className='settings__meta form-group form-label'>Other</span>
                                    <Select
                                        placeholder='Select Unit'
                                        options={options}
                                        defaultValue={unit}
                                        onChange={unitChangeHandler}
                                        size='large'
                                        suffixIcon={<CaretDown size={18} />}
                                        style={{ width: 75 }}
                                        loading
                                    />
                                </div>
                            </Flex>
                        </Space>
                    </Col>
                </Row>
            </Modal>
        </>
    );
};

export default Header;