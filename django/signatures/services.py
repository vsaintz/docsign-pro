import base64

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from documents.models import Document

from .models import DocumentSignature


class SignatureService:
    @staticmethod
    def compute_document_hash(document: Document) -> bytes:
        data = document.get_normalized_data()
        if not data:
            raise ValueError("Document has no normalized data to sign.")
        return bytes.fromhex(data.content_hash)

    @classmethod
    def sign_document(cls, document: Document, user) -> DocumentSignature:
        if document.processing_status != Document.ProcessingStatus.READY:
            raise ValueError(
                "Document must finish processing successfully before it can be signed."
            )
        if document.signing_status == Document.SigningStatus.SIGNED:
            raise ValueError("Document is already signed.")

        doc_hash = cls.compute_document_hash(document)

        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        public_key = private_key.public_key()

        signature = private_key.sign(
            doc_hash,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )

        pem_public_key = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        doc_signature = DocumentSignature.objects.create(
            document=document,
            signer=user,
            document_hash=doc_hash.hex(),
            cryptographic_signature=base64.b64encode(signature).decode("utf-8"),
            public_key=pem_public_key.decode("utf-8"),
        )
        return doc_signature

    @classmethod
    def verify_signature(cls, signature: DocumentSignature) -> bool:
        try:
            current_hash = cls.compute_document_hash(signature.document)

            public_key = serialization.load_pem_public_key(
                signature.public_key.encode("utf-8")
            )
            if not isinstance(public_key, rsa.RSAPublicKey):
                return False

            raw_signature = base64.b64decode(signature.cryptographic_signature)
            public_key.verify(
                raw_signature,
                current_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH,
                ),
                hashes.SHA256(),
            )
            return True
        except InvalidSignature:
            return False
        except Exception:
            return False
