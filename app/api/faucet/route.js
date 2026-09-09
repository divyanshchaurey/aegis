import { ethers } from "ethers";

export async function POST(request) {
  try {
    const body = await request.json();
    const recipient = body.address;

    if (!recipient || !ethers.isAddress(recipient)) {
      return Response.json(
        { error: "Valid Ethereum recipient address is required." },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const adminWallet = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );

    const tx = await adminWallet.sendTransaction({
      to: recipient,
      value: ethers.parseEther("100"),
    });
    const receipt = await tx.wait();

    return Response.json({
      success: true,
      txHash: receipt.hash,
      recipient,
      amount: "100 ETH",
    });
  } catch (error) {
    console.error("Faucet error:", error);
    return Response.json(
      { error: "Local Hardhat node is offline. The 1-click test ETH faucet is designed for localhost. For cloud previews, switch to a public testnet or use the Persona Preview buttons!" },
      { status: 503 }
    );
  }
}
