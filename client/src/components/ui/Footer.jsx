import "../../styles/Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-text">
        <p>ⓒ {year} MarkoDreams</p>
      </div>
    </footer>
  );
};

export default Footer;