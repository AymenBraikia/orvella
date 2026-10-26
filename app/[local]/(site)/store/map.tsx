export default function Map({ store_name, address }: { store_name: string; address: string }) {
    const query = encodeURIComponent(`${store_name}, ${address}`);
    return (
        <div className="w-full overflow-hidden ">
            <iframe
                src={`https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${store_name} location map`}
            ></iframe>
        </div>
    );
}
