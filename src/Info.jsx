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
                        I am a web developer in training, currently studying Software Engineering,
                        in the 4th semester.<br />
                        I am looking for opportunities to work and learn
                        from experienced professionals in the field of web development and technology.
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
                <h3>Web</h3>
                <a href="https://production-hasu.work/info/">Production Hasu</a>
            </div>
        </div>
    );
}

export default Info;