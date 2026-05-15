export const generateTicket = (borrowData) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 400, 250);
    
    // Border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 400, 250);

    // Text
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 20px serif';
    ctx.fillText('ISU LIBRARY TICKET', 100, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`User: ${borrowData.user_email}`, 40, 90);
    ctx.fillText(`Book ID: ${borrowData.book_id}`, 40, 120);
    ctx.fillText(`Issue Date: ${new Date().toLocaleDateString()}`, 40, 150);
    ctx.fillText(`Due Date: ${borrowData.due_date}`, 40, 180);

    ctx.font = 'italic 12px sans-serif';
    ctx.fillText('Present this at the desk to claim.', 100, 220);

    const link = document.createElement('a');
    link.download = `Ticket_${borrowData.book_id}.png`;
    link.href = canvas.toDataURL();
    link.click();
};