import "./Info.css";
import foto from './assets/perfilPortafolio.jpg';

function Info() {
    return (
        <div className="container_Info">
            <h2 className="titulo_Info">INFO</h2>
            <h2 className="titulo_Profile">PROFILE</h2>
            <div className="container_Profile">
                <img src={foto} alt="Perfil" className="profile-image" />
                <div className="profile-text">
                    <p>
                        Soy un desarrollador web en formación, actualmente estudiando Ingeniería de Software,
                        cursando el 4to semestre.<br />
                        Busco oportunidades para trabajar y aprender
                        de profesionales experimentados en el campo del desarrollo web y la tecnología.
                    </p>
                </div>
            </div>

            <div className="social-buttons">
                <a href="https://www.facebook.com/profile.php?id=100014736848324" target="_blank" >FACEBOOK</a>
                <a href="https://www.instagram.com/giler148/" target="_blank">INSTAGRAM</a>
                <a href="https://www.linkedin.com/in/david-giler-rizzo-51b7892b0/" target="_blank">LINKEDIN</a>
            </div>

            <h2 className="titulo_Profile">PROGRAMMING LANGUAGES</h2>
            <div className="tecnologias">
                <img
                    src="https://skillicons.dev/icons?i=java,javascript,html,css,react,php,tailwind,vite&perline=8"
                    alt="My Skills"
                />
            </div>
            <h2 className="titulo_Profile">TOOLS</h2>
            <div className="herramientas">
                <img
                    src="https://skillicons.dev/icons?i=aws,nodejs,mysql,git,github,gitlab,discord,gmail,latex,vscode,npm&perline=11"
                    alt="My Skills"
                />
            </div>
            <h2 className="titulo_Profile">CREDITS</h2>
            <div className="credits">
                <h3>Web Site</h3>
                <a href="https://production-hasu.work/info/">Production Hasu</a>
            </div>
        </div>
    );
}

export default Info;
