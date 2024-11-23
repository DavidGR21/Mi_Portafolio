import "./Contact.css";
function Info() {

    return (
        <div className="container_Contact">
            <h2 className="titulo_Info">CONTACT</h2>
            <div className="formContainer">
                <input required id="email" placeholder="example@email.com" type="email" />
                <label htmlFor="email">Email</label>
                <input id="name" placeholder="Your name" type="text" />  
                <label htmlFor="name">Name</label>
                <textarea id="message" placeholder="Write your message" rows="5"></textarea>
                <label htmlFor="message">Message</label>
                <div className="social-buttons">
                    <a >SUBMIT</a>
                </div>
            </div>
        </div>
    );                                                                                                                                                                            
}

export default Info;
