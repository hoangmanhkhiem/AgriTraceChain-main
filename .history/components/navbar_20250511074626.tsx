const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    // 1. Upload product data to IPFS
    toast({
      title: "Processing...",
      description: "Uploading product data to IPFS...",
    });
    
    // Prepare metadata object with all product information
    const productMetadata = {
      ...formData,
      producer: walletAddress,
      timestamp: new Date().toISOString(),
    };
    
    const ipfsUrl = await uploadToIPFS(productMetadata);
    
    toast({
      title: "IPFS Upload Complete",
      description: "Product data successfully stored on IPFS",
    });
    
    // 2. Mint NFT with IPFS link as metadata
    toast({
      title: "Processing...",
      description: "Minting NFT on the blockchain...",
    });
    
    const tokenName = `${formData.name.replace(/\s+/g, '_')}_${Date.now()}`;
    
    // THAY THAY ĐỔI Ở ĐÂY: Lấy địa chỉ đúng cách từ Mesh SDK
    // Sử dụng hàm getUsedAddresses() hoặc getRewardAddresses() thay vì getChangeAddress()
    const usedAddresses = await wallet.getUsedAddresses();
    const addr = usedAddresses[0]; // Sử dụng địa chỉ đầu tiên
    const pubkey = addr ? deserializeAddress(addr).pubKeyHash : "";
    
    // NFT metadata structure
    const nftMetadata = {
      name: formData.name || "Unnamed Product",
      description: formData.description || "Agricultural product",
      image: "ipfs://bafybeifq4vh5ebzq3h73pnksrdrxovt66g5ku3jjcggjjwxra3mcqxhe5m",
      mediaType: "image/jpeg",
      data: ipfsUrl || "",
      _pk: pubkey || "", // Đảm bảo không null/undefined
    };
    
    // Call mint NFT function
    const mintResult = await mintNFT(
      wallet, 
      tokenName,
      nftMetadata
    );
    
    // Phần còn lại giữ nguyên