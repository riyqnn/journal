const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export const uploadFileToIPFS = async (file: File) => {
    if (!PINATA_JWT) {
        throw new Error("Pinata JWT not found in env variables");
    }

    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
        name: file.name,
    });
    formData.append("pinataMetadata", metadata);

    // Options (Optional)
    const options = JSON.stringify({
        cidVersion: 1,
    });
    formData.append("pinataOptions", options);

    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`Pinata Upload Error: ${res.statusText}`);
        }

        const data = await res.json();
        return data.IpfsHash;

    } catch (error) {
        console.error("Error uploading to Pinata:", error);
        throw error;
    }
};