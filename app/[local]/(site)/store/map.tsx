export default function Map() {
    const address = encodeURIComponent("ARVELL, Marie-Curie-Straße 14, 60439 Frankfurt am Main, Germany");
    return (
        <div className="w-full overflow-hidden ">
            <iframe
                src={`https://maps.google.com/maps?q=${address}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ARVELL Location Map"
            ></iframe>
        </div>
    );
}
