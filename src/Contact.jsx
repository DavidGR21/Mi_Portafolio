import React, { useState } from 'react';
import './Contact.css';

function Info() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    return (
        <div className="container_Contact">
            <h2 className="titulo_Info">CONTACT</h2>
            <form className="formContainer">
                <input
                    required
                    id="email"
                    placeholder="example@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="email">Email</label>
                <input
                    id="name"
                    required
                    placeholder="Your name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <label htmlFor="name">Name</label>
                <textarea
                    id="message"
                    required
                    placeholder="Write your message"
                    rows="5"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <label htmlFor="message">Message</label>
                <div className="social-buttons">
                    <button type="submit">SUBMIT</button>
                </div>
            </form>
        </div>
    );
}

export default Info;
