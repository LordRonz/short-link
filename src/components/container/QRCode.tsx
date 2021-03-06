import ReactQRCode from 'react-qr-code';

const QRCode = ({ link, className }: { link: string; className?: string }) => {
  return (
    <div className={className}>
      <ReactQRCode
        value={link}
        className='mx-auto'
        bgColor='#222222'
        fgColor='var(--clr-primary-300)'
        id='QRCode'
      />
    </div>
  );
};

export default QRCode;
