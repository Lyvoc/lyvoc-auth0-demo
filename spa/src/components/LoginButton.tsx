import { useAuth0 } from "../auth";
import { defineMessages, useMessages } from "../i18n";

const MESSAGES = defineMessages({ logIn: "Log In" }, { logIn: "Se connecter" });

const LoginButton = () => {
    const { loginWithRedirect } = useAuth0();
    const m = useMessages(MESSAGES);
    return (
        <button 
            onClick={() => loginWithRedirect()} 
            className="button login"
        >
            {m.logIn}
        </button>
    );
};

export default LoginButton;