import "./Contact.css";
function Info() {

    return (
        <div className="container_Info">
            <div className="formContainer">
                <button type="submit">Send</button>
                <textarea id="message" placeholder="Write your message" rows="5"></textarea>
                <label htmlFor="message">Message</label>
                <input id="name" placeholder="Your name" type="text" />
                <label htmlFor="name">Name</label>
                <input id="email" placeholder="example@email.com" type="email" />
                <label htmlFor="email">Email</label>
            </div>
        </div>
    );
}

export default Info;
