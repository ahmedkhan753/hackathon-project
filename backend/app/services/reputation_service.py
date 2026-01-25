"""
Reputation Engine Service
Implements weighted reputation scoring for providers based on reviews and reliability metrics
"""
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.review import Review
from app.models.booking import Booking
from app.models.user import User
from app.models.service import Service


class ReputationService:
    """
    Calculates provider reputation scores using weighted algorithms
    """

    # Configuration constants
    K_FACTOR = 5.0  # Confidence threshold for new providers
    DECAY_LAMBDA = 0.01  # Time decay factor (higher = faster decay)
    COMPLETION_WEIGHT = 0.3  # Weight for completion rate
    REVIEW_WEIGHT = 0.7  # Weight for review ratings

    @staticmethod
    def calculate_provider_score(provider_id: int, db: Session) -> Dict[str, float]:
        """
        Calculate comprehensive reputation score for a provider

        Returns:
            {
                "overall_score": float (0-5),
                "review_score": float (0-5),
                "completion_rate": float (0-1),
                "total_reviews": int,
                "total_bookings": int,
                "completed_bookings": int
            }
        """
        # Get all bookings for this provider
        bookings = db.query(Booking).filter(Booking.service.has(provider_id=provider_id)).all()

        if not bookings:
            return {
                "overall_score": 0.0,
                "review_score": 0.0,
                "completion_rate": 0.0,
                "total_reviews": 0,
                "total_bookings": 0,
                "completed_bookings": 0
            }

        total_bookings = len(bookings)
        completed_bookings = len([b for b in bookings if b.status == "completed"])
        completion_rate = completed_bookings / total_bookings if total_bookings > 0 else 0.0

        # Get reviews for this provider
        reviews = db.query(Review).filter(Review.provider_id == provider_id).all()
        total_reviews = len(reviews)

        if not reviews:
            review_score = 0.0
        else:
            # Calculate time-weighted review score
            review_score = ReputationService._calculate_weighted_review_score(reviews)

        # Calculate overall score using weighted combination
        overall_score = ReputationService._calculate_overall_score(
            review_score, completion_rate, total_reviews
        )

        return {
            "overall_score": round(overall_score, 2),
            "review_score": round(review_score, 2),
            "completion_rate": round(completion_rate, 2),
            "total_reviews": total_reviews,
            "total_bookings": total_bookings,
            "completed_bookings": completed_bookings
        }

    @staticmethod
    def _calculate_weighted_review_score(reviews: List[Review]) -> float:
        """
        Calculate time-weighted average of reviews
        Recent reviews have higher weight
        """
        if not reviews:
            return 0.0

        now = datetime.utcnow()
        total_weight = 0.0
        weighted_sum = 0.0

        for review in reviews:
            # Calculate days since review
            days_old = (now - review.created_at).days
            # Exponential decay: newer reviews have higher weight
            weight = math.exp(-ReputationService.DECAY_LAMBDA * days_old)

            weighted_sum += review.rating * weight
            total_weight += weight

        return weighted_sum / total_weight if total_weight > 0 else 0.0

    @staticmethod
    def _calculate_overall_score(review_score: float, completion_rate: float, total_reviews: int) -> float:
        """
        Combine review score and completion rate with confidence weighting
        """
        # Base score from reviews and completion
        base_score = (
            review_score * ReputationService.REVIEW_WEIGHT +
            (completion_rate * 5.0) * ReputationService.COMPLETION_WEIGHT
        )

        # Apply confidence adjustment for new providers
        confidence_factor = min(total_reviews / ReputationService.K_FACTOR, 1.0)

        # Blend with global average (assume 3.0 for new providers)
        global_average = 3.0
        adjusted_score = confidence_factor * base_score + (1 - confidence_factor) * global_average

        return min(max(adjusted_score, 0.0), 5.0)

    @staticmethod
    def get_top_providers(db: Session, limit: int = 10) -> List[Dict]:
        """
        Get top-rated providers with their scores
        """
        providers = db.query(User).join(Service, User.id == Service.provider_id).distinct().all()

        provider_scores = []
        for provider in providers:
            score_data = ReputationService.calculate_provider_score(provider.id, db)
            if score_data["total_bookings"] > 0:  # Only include active providers
                provider_scores.append({
                    "provider_id": provider.id,
                    "provider_name": provider.name,
                    "score_data": score_data
                })

        # Sort by overall score descending
        provider_scores.sort(key=lambda x: x["score_data"]["overall_score"], reverse=True)

        return provider_scores[:limit]

    @staticmethod
    def add_review(db: Session, booking_id: int, seeker_id: int, rating: float, comment: str = None) -> Review:
        """
        Add a review for a completed booking
        """
        # Verify booking exists and is completed
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError("Booking not found")
        if booking.status != "completed":
            raise ValueError("Can only review completed bookings")
        if booking.seeker_id != seeker_id:
            raise ValueError("Only the seeker can review this booking")

        # Check if review already exists
        existing_review = db.query(Review).filter(Review.booking_id == booking_id).first()
        if existing_review:
            raise ValueError("Review already exists for this booking")

        # Create review
        review = Review(
            booking_id=booking_id,
            provider_id=booking.service.provider_id,
            seeker_id=seeker_id,
            rating=max(1.0, min(5.0, rating)),  # Clamp to 1-5 range
            comment=comment
        )

        db.add(review)
        db.commit()
        db.refresh(review)

        return review


# Global instance
reputation_service = ReputationService()
