import React, {useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Modal,} from "../../components";
import {AiFillWindows} from "react-icons/ai";
import {ThemeContext} from '../../contexts/ThemeContext';
import OneDrawLogo from "../../assets/img/logos/one_draw_logo.png";
import OneDrawLogoWhite from "../../assets/img/logos/one_draw_logo_white.png";
import AuthGradient from "../../assets/img/background-gradients/bg-gradient.png";
import AuthPattern from "../../assets/img/background-gradients/bg-pattern.png";
import getMsalInstance from "../../helpers/getMsalInstance";
import {Button} from "antd";
import {useViewerStore} from "../../store/store";
import { logger } from "../../services/loggingService";


const Login = () => {

    const msalInstance = getMsalInstance()

    const {theme} = useContext(ThemeContext);

    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const closeModal = () => {
        msalInstance.logoutRedirect();
        setShowModal(false);
    }

    useEffect(() => {

        window.addEventListener('userLoginSuccess', (event) => {
            if (event.detail.redirect && event.detail.validated) {
                useViewerStore.setState({
                    isUserRedirectedToSiteAfterLogin: true
                })
                navigate("/sites")
            }
        });

        window.addEventListener("userHasNoEntitlement", (event) => {
            setShowModal(true);
            sessionStorage.clear();
            localStorage.clear();

        })

        return () => {
            window.removeEventListener('userLoginSuccess', (event) => {
                if (event.detail?.redirect && event.detail?.validated) {
                    navigate("/sites")
                }
            });

            window.removeEventListener("userHasNoEntitlement", (event) => {
                logger.warn("Unauthorized Access");
                setShowModal(true);
                sessionStorage.clear();
                localStorage.clear();

            })
        }

    }, [showModal]);


    // Sign In to Azure
    const handleSignIn = (e) => {
        e.preventDefault();

        try {

            // handleMicrosoftLogin()

            msalInstance.loginRedirect({
                scopes: [process.env.REACT_APP_AZURE_TOKEN_SCOPE],
            })
        } catch (error) {
            logger.error(error);
        }
    };


    return (
        <>
            <section className="auth">
                <div className="auth__header">
                    <div className="auth__header--logo">
                        {theme === 'dark' ? (
                            <img src={OneDrawLogoWhite} alt="OneDraw"/>
                        ) : (
                            <img src={OneDrawLogo} alt="OneDraw"/>
                        )}
                    </div>
                </div>
                <div className="auth__bg">
                    <img src={AuthGradient} alt="auth_gradient"/>
                </div>
                <div className="auth__bg bg-pattern">
                    <img src={AuthPattern} alt="auth_pattern"/>
                </div>
                <div className="auth__content">
                    <h1 className="auth__title">Welcome to OneDraw</h1>
                    <p className="auth__text">Login to OneDraw securely using your Microsoft account</p>
                    <button className="auth__btn" onClick={handleSignIn}>
                        <AiFillWindows/>
                        Login with Microsoft
                    </button>
                </div>
                <div className="auth__footer">
                    <p className="auth__footer--copy">© Trinity Solar, Inc. 2023. All Rights Reserved.</p>
                </div>
            </section>
            {showModal && (
                <>
                    <Modal
                        title="Unautharized Access!"
                        messageType="error"
                        close={closeModal}
                    >
                        This account does not have access to oneDRAW. Please logout and try with a different account
                        or
                        contact your administrator for permission to access the application.
                        <br/>
                        <br/>
                        When you close this message, you will be asked to log out of your account. Kindly Sign out
                        and try again.
                        <Button
                            type="primary"
                            onClick={closeModal}
                            style={{marginTop: "20px", background: "indianred"}
                            }
                        >
                            Close and Logout
                        </Button>


                    </Modal>
                </>
            )}
        </>
    );
};

export default Login;
